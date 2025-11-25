import type {
	CancelScheduledAutomationPayload,
	EmitEventPayload,
	RunAutomationPayload,
	RunDelayedAutomationPayload,
	ScheduleDelayedAutomationPayload,
} from "db/types"
import type { logger } from "logger"
import type { InternalClient } from "../clients"

import { defineJob } from "../defineJob"

type Logger = typeof logger

const handleRunAutomation = async (
	client: InternalClient,
	payload: RunAutomationPayload,
	logger: Logger
) => {
	const { automationId, pubId, trigger, stageId, stack } = payload

	logger.info({
		msg: `Running automation ${automationId}`,
		automationId,
		pubId,
		trigger,
		stageId,
		stack,
	})

	try {
		const { status, body } = await client.runAutomation({
			params: { automationId, communitySlug: payload.community.slug },
			body: { pubId, trigger, stack },
		})

		if (status >= 400) {
			logger.error({
				msg: "API error running automation",
				automationId,
				pubId,
				status,
				body,
			})
			return
		}

		logger.info({
			msg: "Automation ran successfully",
			automationId,
			pubId,
			result: body,
		})
	} catch (e) {
		logger.error({
			msg: `Error running automation ${automationId}`,
			error: e,
		})
	}
}

const handleScheduleDelayedAutomation = async (
	client: InternalClient,
	payload: ScheduleDelayedAutomationPayload,
	logger: Logger
) => {
	const { automationId, pubId, stack } = payload

	logger.info({
		msg: `Scheduling delayed automation ${automationId}`,
		automationId,
		pubId,
		stack,
	})

	try {
		const { status, body } = await client.scheduleDelayedAutomation({
			params: { automationId, communitySlug: payload.community.slug },
			body: { pubId, stack },
		})

		if (status >= 400) {
			logger.error({
				msg: "API error scheduling delayed automation",
				error: body,
				automationId,
				pubId,
			})
			return
		}

		logger.info({
			msg: "Delayed automation scheduled",
			result: body,
			automationId,
			pubId,
		})
	} catch (e) {
		logger.error({
			msg: "Error scheduling delayed automation",
			error: e,
			automationId,
			pubId,
		})
	}
}

const handleRunDelayedAutomation = async (
	client: InternalClient,
	payload: RunDelayedAutomationPayload,
	logger: Logger
) => {
	const { automationId, pubId, trigger, automationRunId, stack } = payload

	logger.info({
		msg: `Running delayed automation ${automationId}`,
		automationId,
		pubId,
		trigger,
		automationRunId,
		stack,
	})

	try {
		const { status, body } = await client.runDelayedAutomation({
			params: { automationId, communitySlug: payload.community.slug },
			body: { pubId, trigger, automationRunId, stack },
		})

		if (status >= 400) {
			logger.error({
				msg: "API error running delayed automation",
				automationId,
				pubId,
				status,
				body,
			})
			return
		}

		logger.info({
			msg: "Delayed automation ran successfully",
			automationId,
			pubId,
			result: body,
		})
	} catch (e) {
		logger.error({
			msg: `Error running delayed automation ${automationId}`,
			error: e,
		})
	}
}

const handleCancelScheduledAutomation = async (
	client: InternalClient,
	payload: CancelScheduledAutomationPayload,
	logger: Logger
) => {
	const { automationRunId } = payload

	logger.info({
		msg: `Cancelling scheduled automation for automation run ${automationRunId}`,
		automationRunId,
	})

	try {
		const { status, body } = await client.cancelScheduledAutomation({
			params: { automationRunId, communitySlug: payload.community.slug },
			body: {},
		})

		if (status >= 400) {
			logger.error({
				msg: "API error cancelling scheduled automation",
				automationRunId,
				status,
				body,
			})
			return
		}

		logger.info({
			msg: "Scheduled automation cancelled successfully",
			automationRunId,
			result: body,
		})
	} catch (e) {
		logger.error({
			msg: `Error cancelling scheduled automation ${automationRunId}`,
			error: e,
		})
	}
}

export const emitEvent = defineJob(
	async (client: InternalClient, payload: EmitEventPayload, eventLogger, job) => {
		eventLogger.info({ msg: "Starting emitEvent", payload })

		if (!payload?.community?.slug) {
			eventLogger.error({
				msg: "No community slug found in payload",
				job,
			})
			return
		}

		// route based on event type
		switch (payload.type) {
			case "RunAutomation":
				await handleRunAutomation(client, payload, eventLogger)
				break
			case "ScheduleDelayedAutomation":
				await handleScheduleDelayedAutomation(client, payload, eventLogger)
				break
			case "RunDelayedAutomation":
				await handleRunDelayedAutomation(client, payload, eventLogger)
				break
			case "CancelScheduledAutomation":
				await handleCancelScheduledAutomation(client, payload, eventLogger)
				break
			default:
				eventLogger.warn({
					msg: "Unknown event type",
					payload,
				})
		}
	}
)
