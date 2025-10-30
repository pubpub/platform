import type { ZodError } from "zod";

import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	ActionInstances,
	ActionInstancesId,
	CommunitiesId,
	NewRules,
	RulesId,
	RulesUpdate,
} from "db/public";
import type { RuleConfigBase } from "db/types";
import { Event } from "db/public";
import { expect } from "utils";

import type { SequentialRuleEvent } from "~/actions/types";
import { rules } from "~/actions/api";
import { isSequentialRuleEvent } from "~/actions/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";

export class RuleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RuleError";
	}
}

export class RuleConfigError extends RuleError {
	constructor(
		public event: Event,
		public config: Record<string, unknown>,
		public error: ZodError
	) {
		super(`Invalid config for ${event}: ${JSON.stringify(config)}. ${error.message}`);
		this.name = "RuleConfigError";
	}
}

export class RuleCycleError extends RuleError {
	constructor(public path: ActionInstances[]) {
		super(`Creating this rule would create a cycle: ${path.map((p) => p.name).join(" -> ")}`);
		this.name = "RuleCycleError";
	}
}

export class RuleMaxDepthError extends RuleError {
	constructor(public path: ActionInstances[]) {
		super(
			`Creating this rule would exceed the maximum stack depth (${MAX_STACK_DEPTH}): ${path.map((p) => p.name).join(" -> ")}`
		);
		this.name = "RuleMaxDepthError";
	}
}

export class RuleAlreadyExistsError extends RuleError {
	constructor(
		message: string,
		public event: Event,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId?: ActionInstancesId
	) {
		super(message);
		this.name = "RuleAlreadyExistsError";
	}
}

export class SequentialRuleAlreadyExistsError extends RuleAlreadyExistsError {
	constructor(
		public event: SequentialRuleEvent,
		public actionInstanceId: ActionInstancesId,
		public sourceActionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} rule for ${sourceActionInstanceId} running ${actionInstanceId} already exists`,
			event,
			actionInstanceId,
			sourceActionInstanceId
		);
	}
}

export class RegularRuleAlreadyExistsError extends RuleAlreadyExistsError {
	constructor(
		public event: Event,
		public actionInstanceId: ActionInstancesId
	) {
		super(` ${event} rule for ${actionInstanceId} already exists`, event, actionInstanceId);
	}
}

export const createRule = (props: NewRules) =>
	autoRevalidate(db.insertInto("rules").values(props).returningAll());

export const updateRule = (ruleId: RulesId, props: RulesUpdate) =>
	autoRevalidate(db.updateTable("rules").set(props).where("id", "=", ruleId).returningAll());

export const removeRule = (ruleId: RulesId) =>
	autoRevalidate(db.deleteFrom("rules").where("id", "=", ruleId));

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
 * checks if adding a rule would create a cycle, or else adding it would create
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
						.innerJoin("rules", "rules.sourceActionInstanceId", "action_path.id")
						.innerJoin(
							"action_instances",
							"action_instances.id",
							"rules.actionInstanceId"
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
			// 2. a path that would exceed MAX_STACK_DEPTH when adding the new rule
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

export async function createOrUpdateRuleWithCycleCheck(
	data: {
		ruleId?: RulesId;
		event: Event;
		actionInstanceId: ActionInstancesId;
		sourceActionInstanceId?: ActionInstancesId;
		config?: RuleConfigBase | null;
	},
	maxStackDepth = MAX_STACK_DEPTH
) {
	// check the config
	const config = rules[data.event].additionalConfig;

	if (config) {
		try {
			config.parse(data.config);
		} catch (e) {
			throw new RuleConfigError(data.event, data.config ?? {}, e);
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
			throw new RuleCycleError(result.path);
		}

		if ("exceedsMaxDepth" in result && result.exceedsMaxDepth) {
			throw new RuleMaxDepthError(result.path);
		}
	}

	try {
		console.log("data", data);
		if (data.ruleId) {
			const updatedRule = await updateRule(data.ruleId, {
				event: data.event,
				actionInstanceId: data.actionInstanceId,
				sourceActionInstanceId: data.sourceActionInstanceId,
				config: data.config,
			}).executeTakeFirstOrThrow();
			return updatedRule;
		}
		const createdRule = await createRule({
			event: data.event,
			actionInstanceId: data.actionInstanceId,
			sourceActionInstanceId: data.sourceActionInstanceId,
			config: data.config,
		}).executeTakeFirstOrThrow();
		return createdRule;
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			if (isSequentialRuleEvent(data.event)) {
				if (data.sourceActionInstanceId) {
					throw new SequentialRuleAlreadyExistsError(
						data.event,
						data.actionInstanceId,
						data.sourceActionInstanceId
					);
				}
			} else {
				throw new RegularRuleAlreadyExistsError(data.event, data.actionInstanceId);
			}
		}
		throw e;
	}
}

export const getRule = (ruleId: RulesId, communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("rules")
			.selectAll()
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.id", "=", "rules.actionInstanceId")
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
			.where("id", "=", ruleId)
	);
