import type { ZodError } from "zod";

import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	ActionInstances,
	ActionInstancesId,
	AutomationsId,
	AutomationsUpdate,
	CommunitiesId,
	NewAutomations,
} from "db/public";
import type { AutomationConfigBase } from "db/types";
import { Event } from "db/public";
import { expect } from "utils";

import type { SequentialAutomationEvent } from "~/actions/types";
import { automations } from "~/actions/api";
import { isSequentialAutomationEvent } from "~/actions/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";

export class AutomationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AutomationError";
	}
}

export class AutomationConfigError extends AutomationError {
	constructor(
		public event: Event,
		public config: Record<string, unknown>,
		public error: ZodError
	) {
		super(`Invalid config for ${event}: ${JSON.stringify(config)}. ${error.message}`);
		this.name = "AutomationConfigError";
	}
}

export class AutomationCycleError extends AutomationError {
	constructor(public path: ActionInstances[]) {
		super(
			`Creating this automation would create a cycle: ${path.map((p) => p.name).join(" -> ")}`
		);
		this.name = "AutomationCycleError";
	}
}

export class AutomationMaxDepthError extends AutomationError {
	constructor(public path: ActionInstances[]) {
		super(
			`Creating this automation would exceed the maximum stack depth (${MAX_STACK_DEPTH}): ${path.map((p) => p.name).join(" -> ")}`
		);
		this.name = "AutomationMaxDepthError";
	}
}

export class AutomationAlreadyExistsError extends AutomationError {
	constructor(
		message: string,
		public event: Event,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId?: ActionInstancesId
	) {
		super(message);
		this.name = "AutomationAlreadyExistsError";
	}
}

export class SequentialAutomationAlreadyExistsError extends AutomationAlreadyExistsError {
	constructor(
		public event: SequentialAutomationEvent,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} automation for ${sourceActionInstanceId} running ${actionInstanceId} already exists`,
			event,
			actionInstanceId,
			sourceActionInstanceId
		);
	}
}

export class RegularAutomationAlreadyExistsError extends AutomationAlreadyExistsError {
	constructor(
		public event: Event,
		public actionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} automation for ${actionInstanceId} already exists`,
			event,
			actionInstanceId
		);
	}
}

export const createAutomation = (props: NewAutomations) =>
	autoRevalidate(db.insertInto("automations").values(props).returningAll());

export const updateAutomation = (automationId: AutomationsId, props: AutomationsUpdate) =>
	autoRevalidate(
		db.updateTable("automations").set(props).where("id", "=", automationId).returningAll()
	);

export const removeAutomation = (automationId: AutomationsId) =>
	autoRevalidate(db.deleteFrom("automations").where("id", "=", automationId));

const getFullPath = (
	pathResult: { isCycle: boolean; id: ActionInstancesId; path: ActionInstancesId[] },
	sourceActionInstanceId: ActionInstancesId,
	toBeRunActionId: ActionInstancesId
): ActionInstancesId[] => {
	// for MAX_STACK_DEPTH issues, or for direct cycles, show the full path
	if (!pathResult.isCycle || pathResult.id === sourceActionInstanceId) {
		return [sourceActionInstanceId, toBeRunActionId, ...pathResult.path];
	}

	// indirect cycle (sourceActionInstanceId -> toBeRunActionId -> path -> (some node in path))
	const cycleIndex = pathResult.path.findIndex((id) => id === pathResult.id);

	if (cycleIndex !== -1) {
		return [
			sourceActionInstanceId,
			toBeRunActionId,
			...pathResult.path.slice(0, cycleIndex + 1),
		];
	}

	// fallback - shouldn't happen but just in case
	return [sourceActionInstanceId, toBeRunActionId, ...pathResult.path];
};

/**
 * The maximum number of action instances that can be in a sequence in a single stage.
 * TODO: make this trackable across stages
 */
export const MAX_STACK_DEPTH = 10;

/**
 * checks if adding a automation would create a cycle, or else adding it would create
 * a sequence exceeding the MAXIMUM_STACK_DEPTH
 */
async function wouldCreateCycle(
	toBeRunActionId: ActionInstancesId,
	sourceActionInstanceId: ActionInstancesId,
	maxStackDepth = MAX_STACK_DEPTH
): Promise<
	| { hasCycle: true; exceedsMaxDepth: false; path: ActionInstances[] }
	| { hasCycle: false; exceedsMaxDepth: true; path: ActionInstances[] }
	| { hasCycle: false; exceedsMaxDepth: false; path?: never }
> {
	// check if there's a path from toBeRunActionId back to sourceActionInstanceId (cycle)
	// or if any path would exceed MAX_STACK_DEPTH
	const result = await db
		.withRecursive("action_path", (cte) =>
			cte
				.selectFrom("action_instances")
				.select([
					"id",
					sql<ActionInstancesId[]>`array[id]`.as("path"),
					sql<number>`1`.as("depth"),
					sql<boolean>`false`.as("isCycle"),
				])
				.where("id", "=", toBeRunActionId)
				.union((qb) =>
					qb
						.selectFrom("action_path")
						.innerJoin(
							"automations",
							"automations.sourceActionInstanceId",
							"action_path.id"
						)
						.innerJoin(
							"action_instances",
							"action_instances.id",
							"automations.actionInstanceId"
						)
						.select([
							"action_instances.id",
							sql<
								ActionInstancesId[]
							>`action_path.path || array[action_instances.id]`.as("path"),
							sql<number>`action_path.depth + 1`.as("depth"),
							sql<boolean>`action_instances.id = any(action_path.path) OR action_instances.id = ${sourceActionInstanceId}`.as(
								"isCycle"
							),
						])
						.where((eb) =>
							// continue recursion if:
							// 1. we haven't found a cycle yet
							// 2. we haven't exceeded MAX_STACK_DEPTH
							eb.and([
								eb("action_path.isCycle", "=", false),
								eb("action_path.depth", "<=", maxStackDepth),
							])
						)
				)
		)
		.selectFrom("action_path")
		.select(["id", "path", "depth", "isCycle"])
		.where((eb) =>
			// find either:
			// 1. a path that creates a cycle (id = sourceActionInstanceId or id already in path)
			// 2. a path that would exceed MAX_STACK_DEPTH when adding the new automation
			eb.or([eb("isCycle", "=", true), eb("depth", ">=", maxStackDepth)])
		)
		.orderBy(["isCycle desc", "depth desc"])
		.limit(1)
		.execute();

	if (result.length === 0) {
		return {
			hasCycle: false,
			exceedsMaxDepth: false,
		};
	}

	const pathResult = result[0];

	const fullPath = getFullPath(pathResult, sourceActionInstanceId, toBeRunActionId);

	// Get the action instances for the path
	const actionInstances = await db
		.selectFrom("action_instances")
		.selectAll()
		.where("id", "in", fullPath)
		.execute();

	const filledInPath = fullPath.map((id) => {
		const actionInstance = expect(
			actionInstances.find((ai) => ai.id === id),
			`Action instance ${id} not found`
		);
		return actionInstance;
	});

	return {
		hasCycle: pathResult.isCycle,
		exceedsMaxDepth: !pathResult.isCycle && pathResult.depth >= maxStackDepth,
		path: filledInPath,
	} as
		| {
				hasCycle: true;
				exceedsMaxDepth: false;
				path: ActionInstances[];
		  }
		| {
				hasCycle: false;
				exceedsMaxDepth: true;
				path: ActionInstances[];
		  };
}

export async function createOrUpdateAutomationWithCycleCheck(
	data: {
		automationId?: AutomationsId;
		event: Event;
		actionInstanceId: ActionInstancesId;
		sourceActionInstanceId?: ActionInstancesId;
		config?: AutomationConfigBase | null;
	},
	maxStackDepth = MAX_STACK_DEPTH
) {
	// check the config
	const config = automations[data.event].additionalConfig;

	if (config) {
		try {
			config.parse(data.config);
		} catch (e) {
			throw new AutomationConfigError(data.event, data.config ?? {}, e);
		}
	}

	// only check for cycles if this is an action event with a watched action
	if (
		(data.event === Event.actionSucceeded || data.event === Event.actionFailed) &&
		data.sourceActionInstanceId
	) {
		const result = await wouldCreateCycle(
			data.actionInstanceId,
			data.sourceActionInstanceId,
			maxStackDepth
		);

		if (result.hasCycle) {
			throw new AutomationCycleError(result.path);
		}

		if ("exceedsMaxDepth" in result && result.exceedsMaxDepth) {
			throw new AutomationMaxDepthError(result.path);
		}
	}

	try {
		if (data.automationId) {
			const updatedAutomation = await updateAutomation(data.automationId, {
				event: data.event,
				actionInstanceId: data.actionInstanceId,
				sourceActionInstanceId: data.sourceActionInstanceId,
				config: data.config,
			}).executeTakeFirstOrThrow();
			return updatedAutomation;
		}
		const createdAutomation = await createAutomation({
			event: data.event,
			actionInstanceId: data.actionInstanceId,
			sourceActionInstanceId: data.sourceActionInstanceId,
			config: data.config,
		}).executeTakeFirstOrThrow();
		return createdAutomation;
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			if (isSequentialAutomationEvent(data.event)) {
				if (data.sourceActionInstanceId) {
					throw new SequentialAutomationAlreadyExistsError(
						data.event,
						data.actionInstanceId,
						data.sourceActionInstanceId
					);
				}
			} else {
				throw new RegularAutomationAlreadyExistsError(data.event, data.actionInstanceId);
			}
		}
		throw e;
	}
}

export const getAutomation = (automationId: AutomationsId, communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("automations")
			.selectAll()
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.id", "=", "automations.actionInstanceId")
						.selectAll("action_instances")
						.select((eb) => [
							jsonObjectFrom(
								eb
									.selectFrom("stages")
									.whereRef("stages.id", "=", "action_instances.stageId")
									.where("stages.communityId", "=", communityId)
									.selectAll("stages")
							)
								.$notNull()
								.as("stage"),
						])
				)
					.$notNull()
					.as("actionInstance"),
			])
			.where("id", "=", automationId)
	);
