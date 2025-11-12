import type { ZodError } from "zod";

import { captureException } from "@sentry/nextjs";
import { Kysely, sql } from "kysely";

import type { ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type {
	ActionInstancesId,
	ActionRunsId,
	AutomationsId,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { BaseActionInstanceConfig, Json } from "db/types";
import type { Prettify, XOR } from "utils/types";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";
import { tryCatch } from "utils/try-catch";

import type { run as logRun } from "../log/run";
import type { ActionSuccess } from "../types";
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { getAutomation } from "~/lib/db/queries";
import { env } from "~/lib/env/env";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, getPubsWithRelatedValues } from "~/lib/server";
import { getActionConfigDefaults } from "~/lib/server/actions";
import { MAX_STACK_DEPTH } from "~/lib/server/automations";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunity } from "~/lib/server/community";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { ActionConfigBuilder } from "./ActionConfigBuilder";
import { evaluateConditions } from "./evaluateConditions";
import { getActionRunByName } from "./getRuns";
import { createPubProxy } from "./pubProxy";

export type ActionInstanceRunResult = (ClientException | ClientExceptionOptions | ActionSuccess) & {
	stack: ActionRunsId[];
};

export type RunActionInstanceArgs = Prettify<
	{
		communityId: CommunitiesId;
		actionInstanceId: ActionInstancesId;
		/**
		 * extra params passed to the action instance
		 * for now these are the manual arguments when running the action
		 * or the config for an automation
		 */
		actionInstanceArgs: Record<string, unknown> | null;
		stack: ActionRunsId[];
		scheduledActionRunId?: ActionRunsId;
	} & XOR<{ event: Event }, { userId: UsersId }>
>;

const getActionInstance = (actionInstanceId: ActionInstancesId, trx = db) =>
	trx
		.selectFrom("action_instances")
		.where("action_instances.id", "=", actionInstanceId)
		.select((eb) => [
			"id",
			eb.fn.coalesce("config", sql<BaseActionInstanceConfig>`'{}'`).as("config"),
			"createdAt",
			"updatedAt",
			"stageId",
			"action",
			"name",
		])
		.executeTakeFirst();

const _runActionInstance = async (
	args: Prettify<
		RunActionInstanceArgs & {
			actionInstance: Exclude<Awaited<ReturnType<typeof getActionInstance>>, undefined>;
			actionRunId: ActionRunsId;
		} & {
			pub:
				| ProcessedPub<{
						withPubType: true;
						withRelatedPubs: true;
						withStage: true;
						withValues: true;
				  }>
				| undefined;
			json: Json | undefined;
		}
	>
): Promise<ActionInstanceRunResult> => {
	const isActionUserInitiated = "userId" in args;

	const stack = [...args.stack, args.actionRunId];

	const action = getActionByName(args.actionInstance.action);
	const pub = args.pub;

	const [actionRun, actionDefaults, community] = await Promise.all([
		getActionRunByName(args.actionInstance.action),
		getActionConfigDefaults(args.communityId, args.actionInstance.action).executeTakeFirst(),
		getCommunity(args.communityId),
	]);

	if (!community) {
		return {
			error: "Community not found",
			stack,
		};
	}

	if (!args.json && !pub) {
		return {
			error: "No input found",
			stack,
		};
	}

	if (!actionRun || !action) {
		return {
			error: "Action not found",
			stack,
		};
	}
	const actionConfigBuilder = new ActionConfigBuilder(args.actionInstance.action)
		.withConfig(args.actionInstance.config as Record<string, any>)
		.withOverrides(args.actionInstanceArgs as Record<string, any>)
		.withDefaults(actionDefaults?.config as Record<string, any>)
		.validate();
	const mergedConfig = actionConfigBuilder.getMergedConfig();
	const actionForInterpolation = {
		...args.actionInstance,
		config: mergedConfig,
	};

	const interpolationData = pub
		? {
				pub: createPubProxy(pub, community?.slug),

				action: actionForInterpolation,
			}
		: { json: args.json, action: actionForInterpolation };

	let config = null;
	if (pub) {
		const interpolated = await actionConfigBuilder.interpolate(interpolationData);

		const result = interpolated.validate().getResult();

		if (!result.success) {
			logger.error("Invalid action configuration", {
				// config: result.config,
				error: result.error.message,
				code: result.error.code,
				cause: result.error.zodError,
			});

			return {
				title: "Invalid action configuration",
				error: result.error.message,
				cause: result.error.zodError as ZodError<any>,
				issues: result.error.zodError?.issues,
				stack,
			};
		}

		config = result.config;
	} else {
		const result = (await actionConfigBuilder.interpolate(interpolationData)).getResult();

		if (!result.success) {
			return {
				title: "Invalid action configuration",
				error: result.error.message,
				cause: result.error.zodError ?? result.error.cause,
				issues: result.error.zodError?.issues,
				stack,
			};
		}
		config = result.config;
	}

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	});

	try {
		// just hard cast it to one option so we at least have some typesafety
		const result = await (actionRun as typeof logRun)({
			// FIXME: get rid of any
			config: config as any,
			...(pub ? { pub } : { json: args.json ?? ({} as Record<string, any>) }),
			stageId: args.actionInstance.stageId,
			communityId: args.communityId,
			lastModifiedBy,
			actionRunId: args.actionRunId,
			userId: isActionUserInitiated ? args.userId : undefined,
			actionInstance: args.actionInstance,
		});

		if (isClientExceptionOptions(result)) {
			return { ...result, stack };
		}

		return { ...result, stack };
	} catch (error) {
		captureException(error);
		logger.error(error);

		return {
			title: "Failed to run action",
			error: error.message,
			stack,
		};
	}
};

export async function runActionInstance(
	args: RunActionInstanceArgs & {
		automationId: AutomationsId | null;
	} & XOR<
			{
				pubId: PubsId;
			},
			{ json: Json }
		>,
	trx = db
) {
	if (args.stack.length > MAX_STACK_DEPTH) {
		throw new Error(
			`Action instance stack depth of ${args.stack.length} exceeds the maximum allowed depth of ${MAX_STACK_DEPTH}`
		);
	}

	const [actionInstance, pub, automation, community] = await Promise.all([
		getActionInstance(args.actionInstanceId),
		args.pubId
			? await getPubsWithRelatedValues(
					{ pubId: args.pubId, communityId: args.communityId },
					{
						withPubType: true,
						withRelatedPubs: true,
						withStage: true,
						withValues: true,
						depth: 3,
					}
				)
			: null,

		args.automationId ? getAutomation(args.automationId).executeTakeFirst() : null,
		getCommunity(args.communityId),
	]);

	if (actionInstance === undefined) {
		return {
			error: "Action instance not found",
			stack: args.stack,
		};
	}

	if (env.FLAGS?.get("disabled-actions").includes(actionInstance.action)) {
		return { ...ApiError.FEATURE_DISABLED, stack: args.stack };
	}

	if (!actionInstance.action) {
		return {
			error: "Action not found",
			stack: args.stack,
		};
	}
	if (!community) {
		return {
			error: "Community not found",
			stack: args.stack,
		};
	}
	// check if we need to evaluate conditions at execution time
	if (automation?.condition) {
		const automationTiming = (automation as any).conditionEvaluationTiming as
			| string
			| null
			| undefined;
		const shouldEvaluateNow =
			automationTiming === "onExecution" ||
			automationTiming === "both" ||
			// if no timing is set, default to evaluating at execution time for backwards compatibility
			!automationTiming;

		if (shouldEvaluateNow) {
			const input = pub
				? { pub: createPubProxy(pub, community?.slug) }
				: { json: args.json ?? ({} as Json) };
			const [error, res] = await tryCatch(evaluateConditions(automation.condition, input));

			if (error) {
				await insertActionRun(trx, {
					actionInstanceId: args.actionInstanceId,
					pubId: pub?.id,
					json: args.json,
					result: { error: error.message },
					status: ActionRunStatus.failure,
					event: automation.event,
					communityId: args.communityId,
					stack: args.stack,
					scheduledActionRunId: args.scheduledActionRunId,
					actionInstanceArgs: args.actionInstanceArgs,
				});

				return {
					error: error.message,
					stack: args.stack,
				};
			}

			if (!res) {
				logger.debug("Automation condition not met at execution time", {
					automationId: automation.id,
					conditionEvaluationTiming: automationTiming,
					condition: automation.condition,
				});
				return {
					error: "Automation condition not met",
					stack: args.stack,
				};
			}

			logger.debug("Automation condition met at execution time", {
				automationId: automation.id,
				conditionEvaluationTiming: automationTiming,
			});
		}
	}

	const isActionUserInitiated = "userId" in args;

	// we need to first create the action run,
	// in case the action modifies the pub and needs to pass the lastModifiedBy field
	// which in this case would be `action-run:<action-run-id>`

	const actionRuns = await insertActionRun(trx, {
		actionInstanceId: args.actionInstanceId,
		pubId: pub?.id,
		json: args.json as Json,
		event: args.event as Event,
		communityId: args.communityId,
		stack: args.stack,
		scheduledActionRunId: args.scheduledActionRunId,
		actionInstanceArgs: args.actionInstanceArgs as Record<string, unknown> | null,
		result: { scheduled: `Action to be run immediately` },
		status: ActionRunStatus.scheduled,
		userId: isActionUserInitiated ? args.userId : undefined,
	});

	if (actionRuns.length > 1) {
		const errorMessage: ActionInstanceRunResult = {
			title: "Action run failed",
			error: `Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`,
			cause: `Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`,
			stack: args.stack,
		};

		await autoRevalidate(
			trx
				.updateTable("action_runs")
				.set({
					status: ActionRunStatus.failure,
					result: errorMessage,
				})
				.where(
					"id",
					"in",
					actionRuns.map((ar) => ar.id)
				)
		).execute();

		throw new Error(
			`Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`
		);
	}

	const actionRun = actionRuns[0];

	const result = await _runActionInstance({
		...args,
		actionInstance,
		actionRunId: actionRun.id,
		json: args.json,
		pub: pub ?? undefined,
	});

	const status = isClientExceptionOptions(result)
		? ActionRunStatus.failure
		: ActionRunStatus.success;

	logger[status === ActionRunStatus.failure ? "error" : "info"]({
		msg: "Action run finished",
		pubId: args.pubId,
		actionInstanceId: args.actionInstanceId,
		status,
		result,
	});

	// update the action run with the result
	await autoRevalidate(
		trx
			.updateTable("action_runs")
			.set({ status, result })
			.where("id", "=", args.scheduledActionRunId ?? actionRun.id)
	).executeTakeFirstOrThrow(
		() =>
			new Error(
				`Failed to update action run ${actionRun.id} for pub ${args.pubId} and action instance ${args.actionInstanceId}`
			)
	);

	return result;
}

export const runAutomationById = async (
	args:
		| {
				automationId: AutomationsId;
				pubId: PubsId;
				json?: never;
				event: Event;
				communityId: CommunitiesId;
				stack: ActionRunsId[];
				scheduledActionRunId?: ActionRunsId;
				actionInstanceArgs?: Record<string, unknown> | null;
		  }
		| {
				automationId: AutomationsId;
				pubId?: never;
				json: Json;
				event: Event;
				communityId: CommunitiesId;
				stack: ActionRunsId[];
				scheduledActionRunId?: ActionRunsId;
				actionInstanceArgs?: Record<string, unknown> | null;
		  }
): Promise<{
	actionInstanceId: ActionInstancesId;
	result: any;
}> => {
	const automation = await getAutomation(args.automationId).executeTakeFirst();

	if (!automation) {
		throw new Error(`Automation ${args.automationId} not found`);
	}

	const runArgs = args.pubId
		? ({
				pubId: args.pubId,
				communityId: args.communityId,
				actionInstanceId: automation.actionInstance.id,
				event: args.event,
				actionInstanceArgs: args.actionInstanceArgs ?? null,
				stack: args.stack ?? [],
				automationId: args.automationId,
				scheduledActionRunId: args.scheduledActionRunId,
			} as const)
		: ({
				json: args.json!,
				communityId: args.communityId,
				actionInstanceId: automation.actionInstance.id,
				event: args.event,
				actionInstanceArgs: args.actionInstanceArgs ?? null,
				stack: args.stack ?? [],
				automationId: args.automationId,
				scheduledActionRunId: args.scheduledActionRunId,
			} as const);

	const result = await runActionInstance(runArgs as any, db);

	return {
		actionInstanceId: automation.actionInstance.id,
		result,
	};
};

export const runInstancesForEvent = async (
	pubId: PubsId,
	stageId: StagesId | null,
	event: Event,
	communityId: CommunitiesId,
	stack: ActionRunsId[],
	automationId?: AutomationsId,
	trx = db
) => {
	let query = trx
		.selectFrom("action_instances")
		.innerJoin("automations", "automations.actionInstanceId", "action_instances.id")
		.select([
			"action_instances.id as actionInstanceId",
			"automations.config as automationConfig",
			"automations.id as automationId",
			"action_instances.name as actionInstanceName",
			"action_instances.stageId as stageId",
		])
		.where("automations.event", "=", event);

	if (stageId) {
		query = query.where("action_instances.stageId", "=", stageId);
	}

	if (automationId) {
		query = query.where("automations.id", "=", automationId);
	}

	const instances = await query.execute();

	const results = await Promise.all(
		instances.map(async (instance) => {
			return {
				actionInstanceId: instance.actionInstanceId,
				actionInstanceName: instance.actionInstanceName,
				result: await runActionInstance(
					{
						pubId,
						communityId,
						actionInstanceId: instance.actionInstanceId,
						event,
						actionInstanceArgs: instance.automationConfig ?? null,
						stack,
						automationId: instance.automationId,
					},

					trx
				),
			};
		})
	);

	return results;
};

export function insertActionRun(
	trx: Kysely<Database>,
	args: {
		actionInstanceId: ActionInstancesId;
		pubId?: PubsId;
		json?: Json;
		event: Event;
		communityId: CommunitiesId;
		stack: ActionRunsId[];
		scheduledActionRunId?: ActionRunsId;
		actionInstanceArgs?: Record<string, unknown> | null;
		result: Record<string, unknown>;
		status: ActionRunStatus;
		userId?: UsersId;
	}
) {
	return autoRevalidate(
		trx
			.insertInto("action_runs")
			.values((eb) => ({
				id: args.scheduledActionRunId,
				actionInstanceId: args.actionInstanceId,
				pubId: args.pubId,
				json: args.json,
				userId: "userId" in args ? (args.userId as UsersId | null) : null,
				result: args.result,
				status: args.status,
				// this is a bit hacky, would be better to pass this around methinks
				config:
					args.actionInstanceArgs ??
					eb
						.selectFrom("action_instances")
						.select("config")
						.where("action_instances.id", "=", args.actionInstanceId),
				params: args,
				event: "userId" in args ? undefined : args.event,
				sourceActionRunId: args.stack.at(-1),
			}))
			.returningAll()
			// conflict should only happen if a scheduled action is excecuted
			// not on user initiated actions or on other events
			.onConflict((oc) =>
				oc.column("id").doUpdateSet({
					params: args,
					event: "userId" in args ? undefined : args.event,
				})
			)
	).execute();
}
