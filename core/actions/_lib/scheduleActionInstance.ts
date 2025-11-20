import type { Json } from "contracts";
import type { ActionInstancesId, ActionRunsId, AutomationsId, PubsId, StagesId } from "db/public";
import { ActionRunStatus, AutomationEvent, ConditionEvaluationTiming } from "db/public";
import { logger } from "logger";

import type { SchedulableAutomation } from "./triggers";
import type { GetEventAutomationOptions } from "~/lib/db/queries";
import { db } from "~/kysely/database";
import { addDuration } from "~/lib/dates";
import { getStageAutomations } from "~/lib/db/queries";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { findCommunityBySlug } from "~/lib/server/community";
import { getJobsClient, getScheduledActionJobKey } from "~/lib/server/jobs";
import { getPubsWithRelatedValues } from "~/lib/server/pub";
import { evaluateConditions } from "./evaluateConditions";
import { createPubProxy } from "./pubProxy";

type Shared = {
	stageId: StagesId;
	stack: ActionRunsId[];
} & GetEventAutomationOptions;

type ScheduleActionInstanceForPubOptions = Shared & {
	pubId: PubsId;
	json?: never;
};

type ScheduleActionInstanceGenericOptions = Shared & {
	pubId?: never;
	json: Json;
};

type ScheduleActionInstanceOptions =
	| ScheduleActionInstanceForPubOptions
	| ScheduleActionInstanceGenericOptions;

export const scheduleDelayedAutomation = async ({
	automationId,
	pubId,
	stack,
}: {
	automationId: AutomationsId;
	pubId: PubsId;
	stack: ActionRunsId[];
}): Promise<{
	automationId: string;
	actionInstanceName: string;
	runAt: string;
}> => {
	const community = await findCommunityBySlug();
	if (!community) {
		throw new Error("Community not found");
	}

	// fetch the specific automation with all its data
	const [automationData, actionInstance] = await Promise.all([
		db
			.selectFrom("automations")
			.where("id", "=", automationId)
			.selectAll()
			.executeTakeFirstOrThrow(),
		db
			.selectFrom("action_instances")
			.innerJoin("automations", "automations.actionInstanceId", "action_instances.id")
			.where("automations.id", "=", automationId)
			.select([
				"action_instances.id",
				"action_instances.name",
				"action_instances.config",
				"action_instances.stageId",
			])
			.executeTakeFirstOrThrow(),
	]);

	const automation = {
		...automationData,
		actionInstanceId: actionInstance.id,
		actionInstanceName: actionInstance.name,
		actionInstanceConfig: actionInstance.config,
		stageId: actionInstance.stageId,
	};

	// validate this is a pubInStageForDuration automation with proper config
	if (automation.event !== AutomationEvent.pubInStageForDuration) {
		throw new Error(`Automation ${automationId} is not a pubInStageForDuration automation`);
	}

	const config = automation.config as Record<string, any> | null;
	if (
		!config ||
		typeof config.automationConfig !== "object" ||
		!config.automationConfig?.duration ||
		!config.automationConfig?.interval
	) {
		throw new Error(`Automation ${automationId} missing duration/interval configuration`);
	}

	const duration = config.automationConfig.duration as number;
	const interval = config.automationConfig.interval as
		| "minute"
		| "hour"
		| "day"
		| "week"
		| "month"
		| "year";

	// check if we need to evaluate conditions before scheduling
	const automationTiming = (automation as any).conditionEvaluationTiming as
		| string
		| null
		| undefined;
	const shouldEvaluateNow =
		automationTiming === ConditionEvaluationTiming.onTrigger ||
		automationTiming === ConditionEvaluationTiming.both;

	const condition = (automationData as any).condition;

	if (shouldEvaluateNow && condition) {
		const pub = await getPubsWithRelatedValues(
			{ pubId, communityId: community.id },
			{
				withPubType: true,
				withRelatedPubs: true,
				withStage: true,
				withValues: true,
				depth: 3,
			}
		);

		if (!pub) {
			throw new Error(`Pub ${pubId} not found`);
		}

		const input = { pub: createPubProxy(pub, community.slug) };
		const evaluationResult = await evaluateConditions(condition as any, input);

		if (!evaluationResult.passed) {
			logger.info({
				msg: "Skipping automation scheduling - conditions not met at trigger time",
				automationId,
				conditionEvaluationTiming: automationTiming,
				failureReason: evaluationResult.failureReason,
				failureMessages: evaluationResult.flatMessages,
			});
			throw new Error("Conditions not met");
		}

		logger.info({
			msg: "Conditions met at trigger time - proceeding with scheduling",
			automationId,
		});
	}

	const runAt = addDuration({
		duration,
		interval,
	}).toISOString();

	const scheduledActionRun = await autoRevalidate(
		db
			.insertInto("action_runs")
			.values({
				actionInstanceId: automation.actionInstanceId as ActionInstancesId,
				pubId,
				status: ActionRunStatus.scheduled,
				config: automation.actionInstanceConfig,
				result: { scheduled: `Action scheduled for ${runAt}` },
				event: automation.event,
				sourceActionRunId: stack.at(-1),
			})
			.returning("id")
	).executeTakeFirstOrThrow();

	const jobsClient = await getJobsClient();

	await jobsClient.scheduleDelayedAutomation({
		automationId,
		actionInstanceId: automation.actionInstanceId as ActionInstancesId,
		duration,
		interval,
		stageId: automation.stageId as StagesId,
		community: {
			slug: community.slug,
		},
		stack,
		scheduledActionRunId: scheduledActionRun.id,
		event: automation.event,
		pubId,
		config: automation.actionInstanceConfig ?? null,
	});

	return {
		automationId,
		actionInstanceName: automation.actionInstanceName,
		runAt,
	};
};

export const scheduleDelayedAutomations = async ({
	pubId,
	stageId,
	stack,
}: {
	pubId: PubsId;
	stageId: StagesId;
	stack: ActionRunsId[];
}): Promise<
	Array<{
		automationId: AutomationsId;
		actionInstanceName: string;
		runAt: string;
	}>
> => {
	const community = await findCommunityBySlug();
	if (!community) {
		throw new Error("Community not found");
	}

	const [automations, jobsClient, pub] = await Promise.all([
		getStageAutomations(stageId, { event: AutomationEvent.pubInStageForDuration }).execute(),
		getJobsClient(),
		getPubsWithRelatedValues(
			{ pubId, communityId: community.id },
			{
				withPubType: true,
				withRelatedPubs: true,
				withStage: true,
				withValues: true,
				depth: 3,
			}
		),
	]);

	if (!automations.length) {
		logger.debug({
			msg: `No delayed automations found for stage ${stageId}`,
			pubId,
			stageId,
		});
		return [];
	}

	const validAutomations = automations
		.filter(
			(automation): automation is typeof automation & SchedulableAutomation =>
				automation.event === AutomationEvent.pubInStageForDuration &&
				Boolean(
					typeof automation.config === "object" &&
						automation.config &&
						"duration" in automation.config &&
						automation.config.duration &&
						"interval" in automation.config &&
						automation.config.interval
				)
		)
		.map((automation) => ({
			...automation,
			duration: automation.config?.automationConfig?.duration || 0,
			interval: automation.config?.automationConfig?.interval || "minute",
		}));

	// evaluate conditions for automations that need it at trigger time
	const automationsToSchedule = [];
	for (const automation of validAutomations) {
		const automationTiming = (automation as any).conditionEvaluationTiming as
			| string
			| null
			| undefined;
		const shouldEvaluateNow =
			automationTiming === ConditionEvaluationTiming.onTrigger ||
			automationTiming === ConditionEvaluationTiming.both;

		if (shouldEvaluateNow && automation.condition) {
			if (!pub || !community) {
				logger.warn({
					msg: "Cannot evaluate conditions without pub data",
					automationId: automation.id,
					pubId,
				});
				continue;
			}

			const input = { pub: createPubProxy(pub, community.slug) };
			const evaluationResult = await evaluateConditions(automation.condition, input);

			if (!evaluationResult.passed) {
				logger.info({
					msg: "Skipping automation scheduling - conditions not met at trigger time",
					automationId: automation.id,
					conditionEvaluationTiming: automationTiming,
					failureReason: evaluationResult.failureReason,
					failureMessages: evaluationResult.flatMessages,
				});
				continue;
			}

			logger.info({
				msg: "Conditions met at trigger time - proceeding with scheduling",
				automationId: automation.id,
			});
		}

		automationsToSchedule.push(automation);
	}

	const results = await Promise.all(
		automationsToSchedule.map(async (automation) => {
			const runAt = addDuration({
				duration: automation.duration,
				interval: automation.interval,
			});

			const scheduledActionRun = await autoRevalidate(
				db
					.insertInto("action_runs")
					.values({
						actionInstanceId: automation.actionInstance.id,
						pubId,
						status: ActionRunStatus.scheduled,
						config: automation.actionInstance.config,
						result: { scheduled: `Automation scheduled for ${runAt.toISOString()}` },
						event: automation.event,
					})
					.returning("id")
			).executeTakeFirstOrThrow();

			const job = await jobsClient.scheduleDelayedAutomation({
				automationId: automation.id,
				actionInstanceId: automation.actionInstance.id,
				duration: automation.duration,
				interval: automation.interval,
				stageId,
				pubId,
				community: {
					slug: await getCommunitySlug(),
				},
				stack,
				scheduledActionRunId: scheduledActionRun.id,
				event: automation.event,
				config: automation.actionInstance.config ?? null,
			});

			return {
				automationId: automation.id,
				actionInstanceName: automation.actionInstance.name,
				runAt: runAt.toISOString(),
			};
		})
	);

	return results;
};

export const scheduleActionInstances = async (options: ScheduleActionInstanceOptions) => {
	if (!options.stageId) {
		throw new Error("StageId is required");
	}

	if (!options.pubId && !options.json) {
		throw new Error("PubId or body is required");
	}

	const community = await findCommunityBySlug();
	if (!community) {
		throw new Error("Community not found");
	}

	const [automations, jobsClient, pub] = await Promise.all([
		getStageAutomations(options.stageId, options).execute(),
		getJobsClient(),
		options.pubId
			? getPubsWithRelatedValues(
					{ pubId: options.pubId, communityId: community.id },
					{
						withPubType: true,
						withRelatedPubs: true,
						withStage: true,
						withValues: true,
						depth: 3,
					}
				)
			: null,
	]);

	if (!automations.length) {
		logger.debug({
			msg: `No action instances found for stage ${options.stageId}. Most likely this is because a Pub is moved into a stage without action instances.`,
			pubId: options.pubId,
			stageId: options.stageId,
			automations,
		});
		return;
	}

	const validAutomations = automations
		.filter(
			(automation): automation is typeof automation & SchedulableAutomation =>
				automation.event === AutomationEvent.actionFailed ||
				automation.event === AutomationEvent.actionSucceeded ||
				automation.event === AutomationEvent.webhook ||
				(automation.event === AutomationEvent.pubInStageForDuration &&
					Boolean(
						typeof automation.config === "object" &&
							automation.config &&
							"duration" in automation.config &&
							automation.config.duration &&
							"interval" in automation.config &&
							automation.config.interval
					))
		)
		.map((automation) => ({
			...automation,
			duration: automation.config?.automationConfig?.duration || 0,
			interval: automation.config?.automationConfig?.interval || "minute",
		}));

	// evaluate conditions for automations that need it at trigger time
	const automationsToSchedule = [];
	for (const automation of validAutomations) {
		// check if we need to evaluate conditions before scheduling
		const automationTiming = (automation as any).conditionEvaluationTiming as
			| string
			| null
			| undefined;
		const shouldEvaluateNow =
			automationTiming === ConditionEvaluationTiming.onTrigger ||
			automationTiming === ConditionEvaluationTiming.both;

		if (shouldEvaluateNow && automation.condition) {
			if (!pub || !community) {
				logger.warn({
					msg: "Cannot evaluate conditions without pub data",
					automationId: automation.id,
					pubId: options.pubId,
				});
				continue;
			}

			const input = { pub: createPubProxy(pub, community.slug) };
			const evaluationResult = await evaluateConditions(automation.condition, input);

			if (!evaluationResult.passed) {
				logger.info({
					msg: "Skipping automation scheduling - conditions not met at trigger time",
					automationId: automation.id,
					conditionEvaluationTiming: automationTiming,
					failureReason: evaluationResult.failureReason,
					failureMessages: evaluationResult.flatMessages,
				});
				continue;
			}

			logger.info({
				msg: "Conditions met at trigger time - proceeding with scheduling",
				automationId: automation.id,
			});
		}

		automationsToSchedule.push(automation);
	}

	const results = await Promise.all(
		automationsToSchedule.flatMap(async (automation) => {
			const runAt = addDuration({
				duration: automation.duration,
				interval: automation.interval,
			}).toISOString();

			const scheduledActionRun = await autoRevalidate(
				db
					.insertInto("action_runs")
					.values({
						actionInstanceId: automation.actionInstance.id,
						pubId: options.pubId,
						json: options.json,
						status: ActionRunStatus.scheduled,
						config: automation.actionInstance.config,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: automation.event,
						sourceActionRunId: options.stack.at(-1),
					})
					.returning("id")
			).executeTakeFirstOrThrow();

			const job = await jobsClient.scheduleDelayedAutomation({
				automationId: automation.id,
				actionInstanceId: automation.actionInstance.id,
				duration: automation.duration,
				interval: automation.interval,
				stageId: options.stageId,
				community: {
					slug: await getCommunitySlug(),
				},
				stack: options.stack,
				scheduledActionRunId: scheduledActionRun.id,
				event: automation.event,
				...(options.pubId
					? { pubId: options.pubId, json: undefined as never }
					: { json: options.json!, pubId: undefined as never }),
				config: automation.actionInstance.config ?? null,
			});

			return {
				result: job,
				actionInstanceId: automation.actionInstance.id,
				actionInstanceName: automation.actionInstance.name,
				runAt,
			};
		})
	);

	return results;
};

// FIXME: this should be updated to allow unscheduling jobs which aren't pub based
export const unscheduleAction = async ({
	actionInstanceId,
	stageId,
	pubId,
	event,
}: {
	actionInstanceId: ActionInstancesId;
	stageId: StagesId;
	pubId: PubsId;
	event: Omit<AutomationEvent, "webhook" | "actionSucceeded" | "actionFailed">;
}) => {
	const jobKey = getScheduledActionJobKey({
		stageId,
		actionInstanceId,
		pubId,
		event: AutomationEvent as AutomationEvent,
	});
	try {
		const jobsClient = await getJobsClient();
		await jobsClient.unscheduleJob(jobKey);

		// TODO: this should probably be set to "canceled" instead of deleting the run
		await autoRevalidate(
			db
				.deleteFrom("action_runs")
				.where("actionInstanceId", "=", actionInstanceId)
				.where("pubId", "=", pubId)
				.where("action_runs.status", "=", ActionRunStatus.scheduled)
		).execute();

		logger.debug({ msg: "Unscheduled action", actionInstanceId, stageId, pubId });
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to unschedule action",
			cause: error,
		};
	}
};

export const cancelScheduledAutomationByActionRunId = async (
	actionRunId: ActionRunsId
): Promise<{ success: boolean; error?: string }> => {
	try {
		const actionRun = await db
			.selectFrom("action_runs")
			.innerJoin("action_instances", "action_instances.id", "action_runs.actionInstanceId")
			.select([
				"action_runs.id as actionRunId",
				"action_runs.pubId",
				"action_runs.event",
				"action_runs.actionInstanceId",
				"action_instances.stageId",
			])
			.where("action_runs.id", "=", actionRunId)
			.where("action_runs.status", "=", ActionRunStatus.scheduled)
			.executeTakeFirst();

		if (!actionRun) {
			logger.warn({
				msg: "Action run not found or not scheduled",
				actionRunId,
			});
			return { success: false, error: "Action run not found or not scheduled" };
		}

		if (!actionRun.pubId || !actionRun.event || !actionRun.actionInstanceId) {
			logger.warn({
				msg: "Action run missing required fields for cancellation",
				actionRunId,
				actionRun,
			});
			return { success: false, error: "Action run missing required fields" };
		}

		const jobKey = getScheduledActionJobKey({
			stageId: actionRun.stageId,
			actionInstanceId: actionRun.actionInstanceId,
			pubId: actionRun.pubId,
			event: actionRun.event,
		});

		const jobsClient = await getJobsClient();
		await jobsClient.unscheduleJob(jobKey);

		await autoRevalidate(
			db
				.updateTable("action_runs")
				.set({
					status: ActionRunStatus.failure,
					result: { cancelled: "Action run cancelled because pub left stage" },
				})
				.where("id", "=", actionRunId)
		).execute();

		logger.info({
			msg: "Successfully cancelled scheduled automation",
			actionRunId,
			jobKey,
		});

		return { success: true };
	} catch (error) {
		logger.error({
			msg: "Error cancelling scheduled automation",
			actionRunId,
			error,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
};
