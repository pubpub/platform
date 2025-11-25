import type { Json } from "contracts"
import type {
	ActionRunsId,
	AutomationRunsId,
	AutomationsId,
	CommunitiesId,
	PubsId,
	StagesId,
} from "db/public"
import type { BaseActionInstanceConfig } from "db/types"
import type { GetEventAutomationOptions } from "~/lib/db/queries"

import { ActionRunStatus, AutomationEvent, ConditionEvaluationTiming } from "db/public"
import { logger } from "logger"
import { expect } from "utils"

import { db } from "~/kysely/database"
import { addDuration } from "~/lib/dates"
import { getAutomation } from "~/lib/db/queries"
import { getAutomationRunById } from "~/lib/server/actions"
import { findCommunityBySlug } from "~/lib/server/community"
import { getJobsClient, getScheduledAutomationJobKey } from "~/lib/server/jobs"
import { getPubsWithRelatedValues } from "~/lib/server/pub"
import { evaluateConditions } from "./evaluateConditions"
import { createPubProxy } from "./pubProxy"
import { insertAutomationRun } from "./runAutomation"

type Shared = {
	stageId: StagesId
	stack: ActionRunsId[]
} & GetEventAutomationOptions

type ScheduleActionInstanceForPubOptions = Shared & {
	pubId: PubsId
	json?: never
}

type ScheduleActionInstanceGenericOptions = Shared & {
	pubId?: never
	json: Json
}

type ScheduleActionInstanceOptions =
	| ScheduleActionInstanceForPubOptions
	| ScheduleActionInstanceGenericOptions

export const scheduleDelayedAutomation = async ({
	automationId,
	pubId,
	stack,
}: {
	automationId: AutomationsId
	pubId: PubsId
	stack: AutomationRunsId[]
}): Promise<{
	automationId: string
	runAt: string
}> => {
	const community = await findCommunityBySlug()
	if (!community) {
		throw new Error("Community not found")
	}

	const automation = await getAutomation(automationId)
	if (!automation) {
		throw new Error(`Automation ${automationId} not found`)
	}

	const trigger = automation.triggers.find(
		(t) => t.event === AutomationEvent.pubInStageForDuration
	)

	// validate this is a pubInStageForDuration automation with proper config
	if (!trigger) {
		throw new Error(`Automation ${automationId} is not a pubInStageForDuration automation`)
	}

	const config = trigger.config as Record<string, any> | null
	if (
		!config ||
		typeof config.automationConfig !== "object" ||
		!config.automationConfig?.duration ||
		!config.automationConfig?.interval
	) {
		throw new Error(`Automation ${automationId} missing duration/interval configuration`)
	}

	const duration = config.automationConfig.duration as number
	const interval = config.automationConfig.interval as
		| "minute"
		| "hour"
		| "day"
		| "week"
		| "month"
		| "year"

	// check if we need to evaluate conditions before scheduling
	const automationTiming = (automation as any).conditionEvaluationTiming as
		| string
		| null
		| undefined
	const shouldEvaluateNow =
		automationTiming === ConditionEvaluationTiming.onTrigger ||
		automationTiming === ConditionEvaluationTiming.both

	const condition = automation.condition

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
		)

		if (!pub) {
			throw new Error(`Pub ${pubId} not found`)
		}

		const input = { pub: createPubProxy(pub, community.slug) }
		const evaluationResult = await evaluateConditions(condition as any, input)

		if (!evaluationResult.passed) {
			logger.info({
				msg: "Skipping automation scheduling - conditions not met at trigger time",
				automationId,
				conditionEvaluationTiming: automationTiming,
				failureReason: evaluationResult.failureReason,
				failureMessages: evaluationResult.flatMessages,
			})
			throw new Error("Conditions not met")
		}

		logger.info({
			msg: "Conditions met at trigger time - proceeding with scheduling",
			automationId,
		})
	}

	const runAt = addDuration({
		duration,
		interval,
	}).toISOString()

	const scheduleAutomationRun = await insertAutomationRun(db, {
		automationId,
		actionRuns: automation.actionInstances.map((ai) => ({
			actionInstanceId: ai.id,
			config: ai.config,
			result: { scheduled: `Action scheduled for ${runAt}` },
			status: ActionRunStatus.scheduled,
		})),
		pubId,
		communityId: community.id,
		stack,
		scheduledAutomationRunId: undefined,
		trigger: {
			event: AutomationEvent.pubInStageForDuration,
			config: trigger.config as Record<string, unknown> | null,
		},
		userId: undefined,
	})

	const jobsClient = await getJobsClient()

	await jobsClient.scheduleDelayedAutomation({
		automationId,
		pubId,
		stageId: automation.stageId as StagesId,
		community: {
			slug: community.slug,
		},
		stack,
		scheduledAutomationRunId: scheduleAutomationRun.id,
		duration,
		interval,
		trigger: {
			event: AutomationEvent.pubInStageForDuration,
			config: trigger.config as Record<string, unknown> | null,
		},
	})

	return {
		automationId,
		runAt,
	}
}

export const cancelScheduledAutomation = async (
	automationRunId: AutomationRunsId,
	communityId: CommunitiesId
): Promise<{ success: boolean; error?: string }> => {
	try {
		const automationRun = await getAutomationRunById(
			communityId,
			automationRunId
		).executeTakeFirstOrThrow()

		if (!automationRun) {
			logger.warn({
				msg: "Automation run not found",
				automationRunId,
			})
			return { success: false, error: "Automation run not found" }
		}

		const jobKey = getScheduledAutomationJobKey({
			stageId: automationRun.stage?.id as StagesId,
			automationId: automationRun.automation?.id as AutomationsId,
			pubId: automationRun.actionRuns[0]?.pubId as PubsId,
			trigger: {
				event: automationRun.actionRuns[0]?.event as AutomationEvent,
				config: automationRun.config as Record<string, unknown> | null,
			},
		})

		const jobsClient = await getJobsClient()
		await jobsClient.unscheduleJob(jobKey)

		await insertAutomationRun(db, {
			automationId: automationRun.automation?.id as AutomationsId,
			scheduledAutomationRunId: automationRunId,
			communityId,
			stack: [automationRunId],
			trigger: {
				event: AutomationEvent.pubInStageForDuration,
				config: automationRun.config as Record<string, unknown> | null,
			},
			actionRuns: automationRun.actionRuns.map((ar) => ({
				actionInstanceId: expect(ar.actionInstanceId),
				config: ar.config as BaseActionInstanceConfig,
				result: { cancelled: "Automation cancelled because pub left stage" },
				status: ActionRunStatus.failure,
			})),
		})

		logger.info({
			msg: "Successfully cancelled scheduled automation",
			automationRunId,
			jobKey,
		})

		return { success: true }
	} catch (error) {
		logger.error({
			msg: "Error cancelling scheduled automation",
			automationRunId,
			error,
		})
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}
