import { randomUUID } from "crypto";

import type { ZodError } from "zod";

import { sql } from "kysely";

import type {
	ActionInstances,
	ActionInstancesId,
	AutomationConditionBlocksId,
	AutomationConditionBlockType,
	AutomationConditionsId,
	AutomationsId,
	NewAutomations,
} from "db/public";
import type { AutomationConfig } from "db/types";
import { AutomationEvent } from "db/public";
import { expect } from "utils";

import type { SequentialAutomationEvent } from "~/actions/types";
import type {
	ConditionBlockFormValue,
	ConditionFormValue,
} from "~/app/c/[communitySlug]/stages/manage/components/panel/actionsTab/ConditionBlock";
import { automations } from "~/actions/api";
import { isSequentialAutomationEvent } from "~/actions/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { findRanksBetween } from "../rank";
import { autoRevalidate } from "./cache/autoRevalidate";
import { maybeWithTrx } from "./maybeWithTrx";

export class AutomationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AutomationError";
	}
}

export class AutomationConfigError extends AutomationError {
	constructor(
		public event: AutomationEvent,
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
		public event: AutomationEvent,
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
		public event: AutomationEvent,
		public actionInstanceId: ActionInstancesId
	) {
		super(
			` ${event} automation for ${actionInstanceId} already exists`,
			event,
			actionInstanceId
		);
	}
}

type AutomationUpsertProps = NewAutomations & {
	id?: AutomationsId;
	condition?: ConditionBlockFormValue;
};

// type FlatItem = (Omit<ConditionBlockFormValue, 'items'> | ConditionItemFormValue )

// type CorrectItem = FlatItem & {
// 	id: string;
// 	parentId?: string;
// }

type OutputItems = {
	blocks: (Omit<ConditionBlockFormValue, "items"> & {
		id: string;
		parentId?: string;
	})[];
	conditions: (ConditionFormValue & {
		id: string;
		parentId?: string;
	})[];
};

const getFlatBlocksAndConditions = (
	parentId: string,
	items: ConditionBlockFormValue["items"],
	accumulator: OutputItems
): OutputItems => {
	const ranks = findRanksBetween({ numberOfRanks: items.length });
	for (const [index, item] of items.entries()) {
		const rank = ranks[index];
		if (item.kind === "condition") {
			accumulator.conditions.push({
				...item,
				id: randomUUID(),
				parentId,
				rank: item.rank || rank, // makes it easy to seed,
			});

			continue;
		}

		const { id: _, items: blockItems, ...blockWithoutItems } = item;
		const blockId = randomUUID();
		accumulator.blocks.push({
			...blockWithoutItems,
			rank: blockWithoutItems.rank || rank,
			id: blockId,
			parentId,
		});

		if (blockItems.length > 0) {
			getFlatBlocksAndConditions(blockId, blockItems, accumulator);
		}
		continue;
	}

	return accumulator;
};

export const upsertAutomation = async (props: AutomationUpsertProps, trx = db) => {
	const res = await maybeWithTrx(trx, async (trx) => {
		const automation = await autoRevalidate(
			trx
				.insertInto("automations")
				.values({
					id: props.id ?? (randomUUID() as AutomationsId),
					event: props.event,
					actionInstanceId: props.actionInstanceId,
					sourceActionInstanceId: props.sourceActionInstanceId,
					config: props.config,
				})
				.onConflict((oc) =>
					oc.columns(["id"]).doUpdateSet((eb) => ({
						event: eb.ref("excluded.event"),
						actionInstanceId: eb.ref("excluded.actionInstanceId"),
						sourceActionInstanceId: eb.ref("excluded.sourceActionInstanceId"),
						config: eb.ref("excluded.config"),
					}))
				)
				.returningAll()
		).executeTakeFirstOrThrow();

		// delete all existing conditions/blocks, which should remove all conditions as well
		console.log("deleting existing conditions/blocks");
		await trx
			.deleteFrom("automation_condition_blocks")
			.where("automationId", "=", automation.id)
			.execute();

		if (!props.condition) {
			console.log("no condition, returning");
			return automation;
		}

		// create new conditions/blocks
		const firstBlockId = randomUUID() as AutomationConditionBlocksId;
		const firstBlock = {
			...props.condition,
			id: firstBlockId,
			parentId: undefined,
		};

		const flatItems = getFlatBlocksAndConditions(firstBlockId, props.condition.items, {
			blocks: [firstBlock],
			conditions: [],
		});

		console.log("flatItems", flatItems);

		// create all block
		await trx
			.insertInto("automation_condition_blocks")
			.values(
				flatItems.blocks.map((block) => ({
					type: block.type as AutomationConditionBlockType,
					rank: block.rank,
					automationConditionBlockId: (block.parentId ??
						null) as AutomationConditionBlocksId | null,
					id: block.id as AutomationConditionBlocksId,
					automationId: automation.id,
				}))
			)
			.execute();

		console.log("flatItems.conditions", flatItems.conditions);

		if (flatItems.conditions.length > 0) {
			await trx
				.insertInto("automation_conditions")
				.values(
					flatItems.conditions.map((condition) => ({
						rank: condition.rank,
						type: condition.type,
						expression: condition.expression,
						id: condition.id as AutomationConditionsId,
						automationConditionBlockId:
							condition.parentId as AutomationConditionBlocksId,
					}))
				)
				.execute();
		}

		return automation;
	});

	return res;
};

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

export async function upsertAutomationWithCycleCheck(
	data: {
		automationId?: AutomationsId;
		event: AutomationEvent;
		actionInstanceId: ActionInstancesId;
		sourceActionInstanceId?: ActionInstancesId;
		config?: AutomationConfig | null;
		condition?: ConditionBlockFormValue;
	},
	maxStackDepth = MAX_STACK_DEPTH
) {
	// check the config
	const additionalConfigSchema = automations[data.event].additionalConfig;

	if (additionalConfigSchema) {
		try {
			additionalConfigSchema.parse(data.config?.automationConfig);
		} catch (e) {
			throw new AutomationConfigError(data.event, data.config?.automationConfig ?? {}, e);
		}
	}

	// only check for cycles if this is an action event with a watched action
	if (
		(data.event === AutomationEvent.actionSucceeded ||
			data.event === AutomationEvent.actionFailed) &&
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
		const res = await upsertAutomation({
			id: data.automationId,
			event: data.event,
			actionInstanceId: data.actionInstanceId,
			sourceActionInstanceId: data.sourceActionInstanceId,
			config: data.config,
			condition: data.condition,
		});
		return res;
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
