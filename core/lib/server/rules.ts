import { sql } from "kysely";

import type { ActionInstances, ActionInstancesId, NewRules, RulesId } from "db/public";
import { Event } from "db/public";
import { expect } from "utils";

import type { SequentialRuleEvent } from "~/actions/types";
import { isSequentialRuleEvent } from "~/actions/types";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoRevalidate } from "./cache/autoRevalidate";

export const createRule = (props: NewRules) => autoRevalidate(db.insertInto("rules").values(props));

export const removeRule = (ruleId: RulesId) =>
	autoRevalidate(db.deleteFrom("rules").where("id", "=", ruleId));

// Function to check if adding a rule would create a cycle
async function wouldCreateCycle(
	toBeRunActionId: ActionInstancesId,
	watchedActionId: ActionInstancesId
): Promise<{ hasCycle: true; path: ActionInstances[] } | { hasCycle: false; path?: never }> {
	// This uses Kysely's withRecursive for the CTE
	const result = await db
		.withRecursive("action_path", (cte) =>
			cte
				.selectFrom("action_instances")
				.select(["id", sql<ActionInstancesId[]>`array[id]`.as("path")])
				.where("id", "=", watchedActionId)
				.unionAll((qb) =>
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
						])
						.where((eb) =>
							// @ts-expect-error FIXME: i straight up don't know what it's yelling about
							// might be related to https://github.com/RobinBlomberg/kysely-codegen/issues/184
							eb.not(eb("action_instances.id", "=", eb.fn.any("action_path.path")))
						)
						.$narrowType<{ id: ActionInstancesId }>()
				)
		)
		.selectFrom("action_path")
		.select(["id", "path"])
		.where((eb) => {
			// Check if the last entry in the path is the action we're about to run
			// This would indicate a cycle
			return eb("id", "=", toBeRunActionId);
		})
		// .where("id", "=", toBeRunActionId)
		.executeTakeFirst();

	if (!result) {
		return {
			hasCycle: false,
			path: undefined,
		};
	}

	// find all the action instances in the path
	const actionInstances = await db
		.selectFrom("action_instances")
		.selectAll()
		.where("id", "in", result.path)
		.execute();

	const filledInPath = result.path.map((id) => {
		const actionInstance = expect(
			actionInstances.find((ai) => ai.id === id),
			`Action instance ${id} not found`
		);
		return actionInstance;
	});

	return {
		hasCycle: true,
		path: filledInPath,
	};
}
export class RuleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RuleError";
	}
}

export class RuleCycleError extends RuleError {
	constructor(public path: ActionInstances[]) {
		super(`Creating this rule would create a cycle: ${path.map((p) => p.name).join(" -> ")}`);
		this.name = "RuleCycleError";
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

export class ReferentialRuleAlreadyExistsError extends RuleAlreadyExistsError {
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

// Function to actually create the rule after checking for cycles
export async function createRuleWithCycleCheck(data: {
	event: Event;
	actionInstanceId: ActionInstancesId;
	watchedActionId?: ActionInstancesId;
	config?: Record<string, unknown> | null;
}) {
	// Only check for cycles if this is an action event with a watched action
	if (
		(data.event === Event.actionSucceeded || data.event === Event.actionFailed) &&
		data.watchedActionId
	) {
		const { hasCycle, path } = await wouldCreateCycle(
			data.actionInstanceId,
			data.watchedActionId
		);

		if (hasCycle) {
			throw new RuleCycleError(path);
		}
	}

	try {
		const createdRule = await createRule({
			event: data.event,
			actionInstanceId: data.actionInstanceId,
			watchedActionId: data.watchedActionId,
			config: data.config ? JSON.stringify(data.config) : null,
		}).executeTakeFirstOrThrow();
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			if (isSequentialRuleEvent(data.event)) {
				if (data.watchedActionId) {
					throw new ReferentialRuleAlreadyExistsError(
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
