import type { Kysely } from "kysely";
import type { ZodError } from "zod";

import { captureException } from "@sentry/nextjs";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { ProcessedPub } from "contracts";
import type { Database } from "db/Database";
import type {
	ActionInstancesId,
	ActionRunsId,
	AutomationEvent,
	AutomationRunsId,
	AutomationsId,
	Communities,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { BaseActionInstanceConfig, Json } from "db/types";
import { ActionRunStatus } from "db/public";
import { logger } from "logger";
import { expect } from "utils";
import { tryCatch } from "utils/try-catch";

import type { run as logRun } from "../log/run";
import type { ActionSuccess } from "../types";
import type { FullAutomation } from "db/types"
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import type { AutoReturnType } from "~/lib/types";
import { db } from "~/kysely/database";
import { getAutomation } from "~/lib/db/queries";
import { env } from "~/lib/env/env";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, getPubsWithRelatedValues } from "~/lib/server";
import { getActionConfigDefaults, getAutomationRunById } from "~/lib/server/actions";
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
	// stack: ActionRunsId[];
	config: BaseActionInstanceConfig;
};

export type RunAutomationArgs = {
	automationId: AutomationsId;
	scheduledAutomationRunId?: AutomationRunsId;
	trigger: {
		event: AutomationEvent;
		config: Record<string, unknown> | null;
	}
	// overrides when running manually
	manualActionInstancesOverrideArgs: {
		[actionInstanceId: ActionInstancesId]: Record<string, unknown> | null;
	} | null;
	userId?: UsersId;
	stack: AutomationRunsId[];
	communityId: CommunitiesId;
	pubId?: PubsId;
	json?: Json;
};

export type RunActionInstanceArgs = {
	automation: FullAutomation;
	community: Communities;
	actionInstance: FullAutomation["actionInstances"][number];
	/**
	 * extra params passed to the action instance
	 * these are provided when running the action manually
	 */
	manualActionInstanceOverrideArgs: Record<string, unknown> | null;
	// stack: ActionRunsId[];
	actionRunId: ActionRunsId;
	pub:
		| ProcessedPub<{
				withPubType: true;
				withRelatedPubs: true;
				withStage: true;
				withValues: true;
		  }>
		| undefined;
	json: Json | undefined;
	stageId: StagesId;
	userId?: UsersId;
};

/**
 * run a singular action instance on an automation
 */
const runActionInstance = async (args: RunActionInstanceArgs): Promise<ActionInstanceRunResult> => {
	const action = getActionByName(args.actionInstance.action);
	const pub = args.pub;

	const [actionRun, actionDefaults] = await Promise.all([
		getActionRunByName(args.actionInstance.action),
		getActionConfigDefaults(args.community.id, args.actionInstance.action).executeTakeFirst(),
	]);

	if (!args.json && !pub) {
		logger.error("No input found", {
			actionInstance: args.actionInstance,
			pub,
			json: args.json,
		});
		return {
			error: "No input found",
			config: args.actionInstance.config as BaseActionInstanceConfig,
		};
	}

	if (!actionRun || !action) {
		logger.error("Action not found", {
			actionInstance: args.actionInstance,
			actionRun,
			action,
		});
		return {
			error: "Action not found",
			config: args.actionInstance.config as BaseActionInstanceConfig,
		};
	}

	const actionConfigBuilder = new ActionConfigBuilder(args.actionInstance.action)
		.withConfig(args.actionInstance.config as Record<string, any>)
		.withOverrides(args.manualActionInstanceOverrideArgs ?? {})
		.withDefaults(actionDefaults?.config as Record<string, any>)
		.validate();
	const mergedConfig = actionConfigBuilder.getMergedConfig();
	const actionForInterpolation = {
		...args.actionInstance,
		config: mergedConfig,
	};

	const interpolationData = pub
		? {
				pub: createPubProxy(pub, args.community.slug),

				action: actionForInterpolation,
			}
		: { json: args.json, action: actionForInterpolation };

	const interpolated = await actionConfigBuilder.interpolate(interpolationData);

	const result = interpolated.validate().getResult();

	if (!result.success) {
		logger.error("Invalid action configuration", {
			// config: result.config,
			error: result.error.message,
			code: result.error.code,
			cause: result.error.zodError,
		});

		const failConfig = interpolated.getResult();
		const resultConfig = failConfig.success ? failConfig.config : args.actionInstance.config;

		return {
			title: "Invalid action configuration",
			error: result.error.message,
			cause: result.error.zodError as ZodError<any>,
			issues: result.error.zodError?.issues,
			config: resultConfig,
		};
	}

	const config = result.config;

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	});

	try {
		// just hard cast it to one option so we at least have some typesafety
		const result = await (actionRun as typeof logRun)({
			// FIXME: get rid of any
			config: config as any,
			...(pub ? { pub } : { json: args.json ?? ({} as Record<string, any>) }),
			stageId: args.stageId,
			communityId: args.community.id,
			lastModifiedBy,
			actionRunId: args.actionRunId,
			userId: args.userId,
			automation: args.automation,
		});

		return { ...result, config };
	} catch (error) {
		captureException(error);
		logger.error(error);

		return {
			title: "Failed to run action",
			error: error.message,
			config: config,
		};
	}
};

export async function runAutomation(args: RunAutomationArgs, trx = db) {
	if (args.stack.length > MAX_STACK_DEPTH) {
		throw new Error(
			`Action instance stack depth of ${args.stack.length} exceeds the maximum allowed depth of ${MAX_STACK_DEPTH}`
		);
	}

	const [pub, automation, community] = await Promise.all([
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
		getAutomation(args.automationId),
		getCommunity(args.communityId),
	]);

	if (!automation) {
		return {
			error: "Automation not found",
			stack: args.stack,
		};
	}

	if (
		automation.actionInstances.some((ai) =>
			env.FLAGS?.get("disabled-actions").includes(ai.action)
		)
	) {
		return { ...ApiError.FEATURE_DISABLED, stack: args.stack };
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
			const [error, evaluationResult] = await tryCatch(
				evaluateConditions(automation.condition, input)
			);

			if (error) {
				if (args.scheduledAutomationRunId) {
					const existingAutomationRun = await getAutomationRunById(
						args.communityId,
						args.scheduledAutomationRunId
					).executeTakeFirstOrThrow();
					if (!existingAutomationRun) {
						throw new Error(
							`Automation run ${args.scheduledAutomationRunId} not found`
						);
					}

					await insertAutomationRun(trx, {
						automationId: automation.id,
						actionRuns: existingAutomationRun.actionRuns.map((ar) => ({
							config: ar.config as BaseActionInstanceConfig,
							result: { error: error.message },
							status: ActionRunStatus.failure,
							actionInstanceId: expect(
								ar.actionInstanceId,
								`Action instance id is required for action run ${ar.id} when creating automation run`
							),
							id: ar.id,
						})),
						pubId: pub?.id,
						json: args.json,
						communityId: args.communityId,
						stack: args.stack,
						scheduledAutomationRunId: args.scheduledAutomationRunId,
						trigger: args.trigger,
						userId: "userId" in args ? args.userId : undefined,
					});
				}

				return {
					error: error.message,
					stack: args.stack,
				};
			}

			if (!evaluationResult.passed) {
				logger.debug("Automation condition not met at execution time", {
					automationId: automation.id,
					conditionEvaluationTiming: automationTiming,
					condition: automation.condition,
					failureReason: evaluationResult.failureReason,
					failureMessages: evaluationResult.flatMessages,
				});
				return {
					title: "Automation condition not met",
					error: evaluationResult.flatMessages.map((m) => m.message).join(", "),
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
	const automationRun = await insertAutomationRun(trx, {
		automationId: args.automationId,
		actionRuns: automation.actionInstances.map((ai) => ({
			actionInstanceId: ai.id,
			config: ai.config,
			result: { scheduled: `Action to be run immediately` },
			status: ActionRunStatus.scheduled,
		})),
		pubId: pub?.id,
		json: args.json as Json,
		communityId: args.communityId,
		stack: args.stack,
		scheduledAutomationRunId: args.scheduledAutomationRunId,
		trigger: args.trigger,
		userId: isActionUserInitiated ? args.userId : undefined,
	});

	const results = await Promise.all(
		automation.actionInstances.map(async (ai) => {
			const correcspondingActionRun = automationRun.actionRuns.find(
				(ar) => ar.actionInstanceId === ai.id
			);
			if (!correcspondingActionRun) {
				throw new Error(`Action run not found for action instance ${ai.id}`);
			}
			const result = await runActionInstance({
				...args,
				actionInstance: ai,
				actionRunId: correcspondingActionRun.id,
				stageId: expect(automation.stageId),
				community,
				manualActionInstanceOverrideArgs:
					args.manualActionInstancesOverrideArgs?.[ai.id] ?? null,
				json: args.json,
				pub: pub ?? undefined,
				automation,
			});

			const status = isClientExceptionOptions(result)
				? ActionRunStatus.failure
				: ActionRunStatus.success;

			logger[status === ActionRunStatus.failure ? "error" : "info"]({
				msg: "Automation run finished",
				pubId: args.pubId,
				actionInstanceId: ai.id,
				status,
				result,
			});
			return { status, result, actionInstance: ai };
		})
	);

	const finalAutomationRun = await insertAutomationRun(trx, {
		automationId: args.automationId,
		actionRuns: results.map((r) => ({
			actionInstanceId: r.actionInstance.id,
			config: r.result.config,
			status: r.status,
			result: r.result,
		})),
		pubId: args.pubId,
		json: args.json,
		trigger: args.trigger,
		communityId: args.communityId,
		stack: args.stack,
		scheduledAutomationRunId: automationRun.id,
		userId: isActionUserInitiated ? args.userId : undefined,
	});

	// // update the action run with the result
	// await autoRevalidate(
	// 	trx
	// 		.updateTable("action_runs")
	// 		.set({ status, result })
	// 		.where("id", "=", args.scheduledActionRunId ?? actionRun.id)
	// ).executeTakeFirstOrThrow(
	// 	() =>
	// 		new Error(
	// 			`Failed to update action run ${actionRun.id} for pub ${args.pubId} and action instance ${args.actionInstanceId}`
	// 		)
	// );

	const success = results.every((r) => r.status === ActionRunStatus.success);

	return {
		success,
		title: success ? "Automation run finished" : "Automation run failed",
		stack: [...args.stack, finalAutomationRun.id],
		report: results?.[0]?.result,
	};
}

// export const runAutomationById = async (
// 	args:
// 		| {
// 				automationId: AutomationsId;
// 				pubId: PubsId;
// 				json?: never;
// 				event: AutomationEvent;
// 				communityId: CommunitiesId;
// 				stack: ActionRunsId[];
// 				scheduledActionRunId?: ActionRunsId;
// 				actionInstanceArgs?: Record<string, unknown> | null;
// 		  }
// 		| {
// 				automationId: AutomationsId;
// 				pubId?: never;
// 				json: Json;
// 				event: AutomationEvent;
// 				communityId: CommunitiesId;
// 				stack: ActionRunsId[];
// 				scheduledActionRunId?: ActionRunsId;
// 				actionInstanceArgs?: Record<string, unknown> | null;
// 		  }
// ): Promise<{
// 	actionInstanceId: ActionInstancesId;
// 	result: any;
// }> => {
// 	const automation = await getAutomation(args.automationId).executeTakeFirst();

// 	if (!automation) {
// 		throw new Error(`Automation ${args.automationId} not found`);
// 	}

// 	const runArgs = args.pubId
// 		? ({
// 				pubId: args.pubId,
// 				communityId: args.communityId,
// 				actionInstanceId: automation.actionInstance.id,
// 				event: args.event,
// 				actionInstanceArgs: args.actionInstanceArgs ?? null,
// 				stack: args.stack ?? [],
// 				automationId: args.automationId,
// 				scheduledActionRunId: args.scheduledActionRunId,
// 			} as const)
// 		: ({
// 				json: args.json!,
// 				communityId: args.communityId,
// 				actionInstanceId: automation.actionInstance.id,
// 				event: args.event,
// 				actionInstanceArgs: args.actionInstanceArgs ?? null,
// 				stack: args.stack ?? [],
// 				automationId: args.automationId,
// 				scheduledActionRunId: args.scheduledActionRunId,
// 			} as const);

// 	const result = await runAutomation(runArgs as any, db);

// 	return {
// 		actionInstanceId: automation.actionInstance.id,
// 		result,
// 	};
// };

// export const runInstancesForEvent = async (
// 	pubId: PubsId,
// 	stageId: StagesId | null,
// 	event: AutomationEvent,
// 	communityId: CommunitiesId,
// 	stack: ActionRunsId[],
// 	automationId?: AutomationsId,
// 	trx = db
// ) => {
// 	let query = trx
// 		.selectFrom("action_instances")
// 		.innerJoin("automations", "automations.actionInstanceId", "action_instances.id")
// 		.select([
// 			"action_instances.id as actionInstanceId",
// 			"automations.config as automationConfig",
// 			"automations.id as automationId",
// 			"action_instances.name as actionInstanceName",
// 			"action_instances.stageId as stageId",
// 		])
// 		.where("automations.event", "=", event);

// 	if (stageId) {
// 		query = query.where("action_instances.stageId", "=", stageId);
// 	}

// 	if (automationId) {
// 		query = query.where("automations.id", "=", automationId);
// 	}

// 	const instances = await query.execute();

// 	const results = await Promise.all(
// 		instances.map(async (instance) => {
// 			return {
// 				actionInstanceId: instance.actionInstanceId,
// 				actionInstanceName: instance.actionInstanceName,
// 				result: await runAutomation(
// 					{
// 						pubId,
// 						communityId,
// 						actionInstanceId: instance.actionInstanceId,
// 						event,
// 						actionInstanceArgs: instance.automationConfig ?? null,
// 						stack,
// 						automationId: instance.automationId,
// 					},

// 					trx
// 				),
// 			};
// 		})
// 	);

// 	return results;
// };

export async function insertAutomationRun(
	trx: Kysely<Database>,
	args: {
		automationId: AutomationsId;
		actionRuns: {
			id?: ActionRunsId;
			actionInstanceId: ActionInstancesId;
			config: BaseActionInstanceConfig;
			result: Record<string, unknown>;
			status: ActionRunStatus;
		}[];
		pubId?: PubsId;
		json?: Json;
		trigger: {
			event: AutomationEvent;
			config: Record<string, unknown> | null;
		};
		communityId: CommunitiesId;
		stack: AutomationRunsId[];
		scheduledAutomationRunId?: AutomationRunsId;
		userId?: UsersId;
	}
) {
	const automatonRun = await autoRevalidate(
		trx
			.with("automationRun", (trx) =>
				trx
					.insertInto("automation_runs")
					.values((eb) => ({
						id: args.scheduledAutomationRunId,
						automationId: args.automationId,
						userId: args.userId,
						config: args.trigger.config,
						event: args.trigger.event,
						sourceAutomationRunId: args.stack.at(-1),
					}))
					.returningAll()
					// conflict should only happen if a scheduled action is excecuted
					// not on user initiated actions or on other events
					.onConflict((oc) =>
						oc.column("id").doUpdateSet({
							config: args.trigger.config,
							event: args.trigger.event,
						})
					)
			)
			.with("actionRuns", (trx) =>
				trx
					.insertInto("action_runs")
					.values((eb) =>
						args.actionRuns.map((ai) => ({
							automationRunId: eb
								.selectFrom("automationRun")
								.select("automationRun.id")
								.where("automationRun.automationId", "=", args.automationId)
								.limit(1),
							actionInstanceId: ai.actionInstanceId,
							pubId: args.pubId,
							json: args.json,
							userId: args.userId,
							config: ai.config,
							event: args.trigger.event,
							status: ai.status,
							result: ai.result,
						}))
					)
					.returningAll()
					// update status and result, and config if it had changed in the meantime
					.onConflict((oc) =>
						oc.column("id").doUpdateSet((eb) => ({
							status: eb.ref("excluded.status"),
							result: eb.ref("excluded.result"),
							config: eb.ref("excluded.config"),
						}))
					)
			)
			.selectFrom("automationRun")
			.selectAll("automationRun")
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("actionRuns")
						.selectAll("actionRuns")
						.whereRef("actionRuns.automationRunId", "=", "automationRun.id")
				).as("actionRuns")
			)
	).executeTakeFirstOrThrow();

	return automatonRun;
}
