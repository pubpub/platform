import type { Json } from "contracts"
import type { ActionInstancesId, ActionRunsId, PubsId, StagesId } from "db/public"
import type { GetEventAutomationOptions } from "~/lib/db/queries"
import type { SchedulableAutomation } from "./automations"

import { ActionRunStatus, Event } from "db/public"
import { logger } from "logger"

import { db } from "~/kysely/database"
import { addDuration } from "~/lib/dates"
import { getStageAutomations } from "~/lib/db/queries"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug"
import { getJobsClient, getScheduledActionJobKey } from "~/lib/server/jobs"

type Shared = {
	stageId: StagesId
	stack: ActionRunsId[]
	/* Config for the action instance */
	config?: Record<string, unknown> | null
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

export const scheduleActionInstances = async (options: ScheduleActionInstanceOptions) => {
	if (!options.stageId) {
		throw new Error("StageId is required")
	}

	if (!options.pubId && !options.json) {
		throw new Error("PubId or body is required")
	}

	const [automations, jobsClient] = await Promise.all([
		getStageAutomations(options.stageId, options).execute(),
		getJobsClient(),
	])

	if (!automations.length) {
		logger.debug({
			msg: `No action instances found for stage ${options.stageId}. Most likely this is because a Pub is moved into a stage without action instances.`,
			pubId: options.pubId,
			stageId: options.stageId,
			automations,
		})
		return
	}

	const validAutomations = automations
		.filter(
			(automation): automation is typeof automation & SchedulableAutomation =>
				automation.event === Event.actionFailed ||
				automation.event === Event.actionSucceeded ||
				automation.event === Event.webhook ||
				(automation.event === Event.pubInStageForDuration &&
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
		}))

	const results = await Promise.all(
		validAutomations.flatMap(async (automation) => {
			const runAt = addDuration({
				duration: automation.duration,
				interval: automation.interval,
			}).toISOString()

			const scheduledActionRun = await autoRevalidate(
				db
					.insertInto("action_runs")
					.values({
						actionInstanceId: automation.actionInstance.id,
						pubId: options.pubId,
						json: options.json,
						status: ActionRunStatus.scheduled,
						config: options.config ?? automation.actionInstance.config,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: automation.event,
						sourceActionRunId: options.stack.at(-1),
					})
					.returning("id")
			).executeTakeFirstOrThrow()

			const job = await jobsClient.scheduleAction({
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
				...(options.pubId ? { pubId: options.pubId } : { json: options.json! }),
				config: options.config ?? automation.actionInstance.config ?? null,
			})

			return {
				result: job,
				actionInstanceId: automation.actionInstance.id,
				actionInstanceName: automation.actionInstance.name,
				runAt,
			}
		})
	)

	return results
}

// FIXME: this should be updated to allow unscheduling jobs which aren't pub based
export const unscheduleAction = async ({
	actionInstanceId,
	stageId,
	pubId,
	event,
}: {
	actionInstanceId: ActionInstancesId
	stageId: StagesId
	pubId: PubsId
	event: Omit<Event, "webhook" | "actionSucceeded" | "actionFailed">
}) => {
	const jobKey = getScheduledActionJobKey({
		stageId,
		actionInstanceId,
		pubId,
		event: event as Event,
	})
	try {
		const jobsClient = await getJobsClient()
		await jobsClient.unscheduleJob(jobKey)

		// TODO: this should probably be set to "canceled" instead of deleting the run
		await autoRevalidate(
			db
				.deleteFrom("action_runs")
				.where("actionInstanceId", "=", actionInstanceId)
				.where("pubId", "=", pubId)
				.where("action_runs.status", "=", ActionRunStatus.scheduled)
		).execute()

		logger.debug({ msg: "Unscheduled action", actionInstanceId, stageId, pubId })
	} catch (error) {
		logger.error(error)
		return {
			error: "Failed to unschedule action",
			cause: error,
		}
	}
}
