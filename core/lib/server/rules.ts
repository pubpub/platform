import type { ZodError } from "zod";

import { sql } from "kysely";

import type { ActionInstances, ActionInstancesId, NewRules, RulesId } from "db/public";
import { Event } from "db/public";
import { expect } from "utils";

import type { SequentialRuleEvent } from "~/actions/types";
import { rules } from "~/actions/api";
import { isSequentialRuleEvent } from "~/actions/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
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
		public watchedActionId?: ActionInstancesId
	) {
		super(message);
		this.name = "RuleAlreadyExistsError";
	}
}

export class SequentialRuleAlreadyExistsError extends RuleAlreadyExistsError {
	constructor(
		public event: SequentialRuleEvent,
		public actionInstanceId: ActionInstancesId,
		public watchedActionId: ActionInstancesId
	) {
		super(
			` ${event} rule for ${watchedActionId} running ${actionInstanceId} already exists`,
			event,
			actionInstanceId,
			watchedActionId
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

export const createRule = (props: NewRules) => autoRevalidate(db.insertInto("rules").values(props));

export const removeRule = (ruleId: RulesId) =>
	autoRevalidate(db.deleteFrom("rules").where("id", "=", ruleId));

/**
 * The maximum number of action instances that can be in a sequence in a single stage.
 * TODO: make this trackable across stages
 */
export const MAX_STACK_DEPTH = 10;

/**
 * Checks if adding a rule would create a cycle, or else adding it would create
 * a sequence exceeding the MAXIMUM_STACK_DEPTH
 *
 * This is a recursive function that checks if there is a path from the watched action to the toBeRun action.
 * If there is, it returns the path and a flag indicating that a cycle would be created.
 * Otherwise, it returns false.
 *
 */
async function wouldCreateCycle(
	toBeRunActionId: ActionInstancesId,
	watchedActionId: ActionInstancesId,
	maxStackDepth = MAX_STACK_DEPTH
): Promise<
	| { hasCycle: true; exceedsMaxDepth: false; path: ActionInstances[] }
	| { hasCycle: false; exceedsMaxDepth: true; path: ActionInstances[] }
	| { hasCycle: false; exceedsMaxDepth: false; path?: never }
> {
	// Check if there's a path from toBeRunActionId back to watchedActionId (cycle)
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
						.innerJoin("rules", "rules.watchedActionId", "action_path.id")
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
							sql<boolean>`action_instances.id = any(action_path.path) OR action_instances.id = ${watchedActionId}`.as(
								"isCycle"
							),
						])
						.where((eb) =>
							// Continue recursion if:
							// 1. We haven't found a cycle yet
							// 2. We haven't exceeded MAX_STACK_DEPTH
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
			// Find either:
			// 1. A path that creates a cycle (id = watchedActionId or id already in path)
			// 2. A path that would exceed MAX_STACK_DEPTH when adding the new rule
			eb.or([eb("isCycle", "=", true), eb("depth", ">=", maxStackDepth)])
		)
		.orderBy(["isCycle desc", "depth desc"])
		.limit(1)
		.execute();

	if (result.length === 0) {
		// No issues found
		return {
			hasCycle: false,
			exceedsMaxDepth: false,
		};
	}

	const pathResult = result[0];

	// Construct the full path
	let fullPath: ActionInstancesId[];

	if (pathResult.isCycle) {
		// For cycles, include the watchedActionId at the beginning to show the complete cycle
		if (pathResult.id === watchedActionId) {
			// Direct cycle: watchedActionId -> toBeRunActionId -> watchedActionId
			fullPath = [watchedActionId, toBeRunActionId, watchedActionId];
		} else {
			// Indirect cycle: watchedActionId -> toBeRunActionId -> path -> (some node in path)
			// Find where the cycle occurs
			const cycleIndex = pathResult.path.findIndex((id) => id === pathResult.id);
			if (cycleIndex !== -1) {
				// Include only the part of the path that forms the cycle
				fullPath = [
					watchedActionId,
					toBeRunActionId,
					...pathResult.path.slice(0, cycleIndex + 1),
				];
			} else {
				// Fallback - shouldn't happen but just in case
				fullPath = [watchedActionId, toBeRunActionId, ...pathResult.path];
			}
		}
	} else {
		// For MAX_STACK_DEPTH issues, show the full path that would be created
		fullPath = [watchedActionId, toBeRunActionId, ...pathResult.path];
	}

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

// Function to actually create the rule after checking for cycles
export async function createRuleWithCycleCheck(
	data: {
		event: Event;
		actionInstanceId: ActionInstancesId;
		watchedActionId?: ActionInstancesId;
		config?: Record<string, unknown> | null;
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

	// Only check for cycles if this is an action event with a watched action
	if (
		(data.event === Event.actionSucceeded || data.event === Event.actionFailed) &&
		data.watchedActionId
	) {
		const result = await wouldCreateCycle(
			data.actionInstanceId,
			data.watchedActionId,
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
		const createdRule = await createRule({
			event: data.event,
			actionInstanceId: data.actionInstanceId,
			watchedActionId: data.watchedActionId,
			config: data.config ? JSON.stringify(data.config) : null,
		}).executeTakeFirstOrThrow();
		return createdRule;
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			if (isSequentialRuleEvent(data.event)) {
				if (data.watchedActionId) {
					throw new SequentialRuleAlreadyExistsError(
						data.event,
						data.actionInstanceId,
						data.watchedActionId
					);
				}
			} else {
				throw new RegularRuleAlreadyExistsError(data.event, data.actionInstanceId);
			}
		}
		throw e;
	}
}
