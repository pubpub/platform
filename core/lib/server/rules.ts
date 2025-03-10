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

// Function to check if adding a rule would create a cycle
async function wouldCreateCycle(
	toBeRunActionId: ActionInstancesId,
	watchedActionId: ActionInstancesId
): Promise<{ hasCycle: true; path: ActionInstances[] } | { hasCycle: false; path?: never }> {
	const forwardResult = await db
		.withRecursive("action_path", (cte) =>
			cte
				.selectFrom("action_instances")
				.select(["id", sql<ActionInstancesId[]>`array[id]`.as("path")])
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
						])
						.where((eb) =>
							eb.not(
								eb(
									"action_instances.id",
									"=",
									eb.fn.any(sql<ActionInstancesId[]>`action_path.path`)
								)
							)
						)
				)
		)
		.selectFrom("action_path")
		.select(["id", "path"])
		.where("id", "=", watchedActionId)
		.execute();

	if (forwardResult.length === 0) {
		return {
			hasCycle: false,
		};
	}

	// if we found a path from toBeRunActionId to watchedActionId, we have a cycle
	// the complete cycle is: watchedActionId -> toBeRunActionId (the new rule) -> path -> watchedActionId
	const cyclePath = [watchedActionId, toBeRunActionId, ...forwardResult[0].path.slice(1)];

	// get the action instances for the path
	const actionInstances = await db
		.selectFrom("action_instances")
		.selectAll()
		.where("id", "in", cyclePath)
		.execute();

	const filledInPath = cyclePath.map((id) => {
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

// Function to actually create the rule after checking for cycles
export async function createRuleWithCycleCheck(data: {
	event: Event;
	actionInstanceId: ActionInstancesId;
	watchedActionId?: ActionInstancesId;
	config?: Record<string, unknown> | null;
}) {
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
