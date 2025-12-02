import type { AutomationRunsId, AutomationsId, CommunitiesId, PubsId } from "db/public"

import { createNextHandler } from "@ts-rest/serverless/next"

import { api } from "contracts"
import { AutomationEvent } from "db/public"
import { logger } from "logger"

import { runAutomation } from "~/actions/_lib/runAutomation"
import {
	cancelScheduledAutomation,
	scheduleDelayedAutomation,
} from "~/actions/_lib/scheduleAutomations"
import { compareAPIKeys, getBearerToken } from "~/lib/authentication/api"
import { env } from "~/lib/env/env"
import { NotFoundError, tsRestHandleErrors } from "~/lib/server"
import { findCommunityBySlug } from "~/lib/server/community"

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader)
	compareAPIKeys(env.API_KEY, apiKey)
}

const handler = createNextHandler(
	api.internal,
	{
		runAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization)
			const { automationId } = params
			const { pubId, trigger, stack } = body

			const community = await findCommunityBySlug()
			if (!community) {
				throw new NotFoundError("Community not found")
			}

			logger.info({
				msg: "Running automation",
				automationId,
				pubId,
				trigger,
				stack,
				communityId: community.id,
			})

			const result = await runAutomation({
				automationId: automationId as AutomationsId,
				manualActionInstancesOverrideArgs: null,
				pubId: pubId as PubsId,
				trigger: {
					event: trigger.event as AutomationEvent,
					config: trigger.config as Record<string, unknown> | null,
				},
				communityId: community.id as CommunitiesId,
				stack: stack as unknown as AutomationRunsId[],
			})

			return {
				status: 200,
				body: {
					automationId,
					result: result,
				},
			}
		},
		scheduleDelayedAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization)
			const { automationId } = params
			const { pubId, stack } = body

			const community = await findCommunityBySlug()
			if (!community) {
				throw new NotFoundError("Community not found")
			}

			logger.info({
				msg: "Scheduling delayed automation",
				automationId,
				pubId,
				stack,
				communityId: community.id,
			})

			const result = await scheduleDelayedAutomation({
				automationId: automationId as AutomationsId,
				pubId: pubId as PubsId,
				stack: stack as unknown as AutomationRunsId[],
			})

			return {
				status: 200,
				body: result,
			}
		},
		runDelayedAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization)
			const { automationId } = params
			const { pubId, trigger, stack, automationRunId } = body
			const community = await findCommunityBySlug()
			if (!community) {
				throw new NotFoundError("Community not found")
			}

			logger.info({
				msg: "Running delayed automation",
				automationId,
				pubId,
				trigger,
				scheduledAutomationRunId: automationRunId,
				stack: stack as unknown as AutomationRunsId[],
				communityId: community.id,
			})

			const result = await runAutomation({
				automationId: automationId as AutomationsId,
				manualActionInstancesOverrideArgs: null,
				pubId: pubId as PubsId,
				trigger,
				communityId: community.id as CommunitiesId,
				stack: stack as unknown as AutomationRunsId[],
				scheduledAutomationRunId: automationRunId,
			})

			return {
				status: 200,
				body: {
					automationId,
					result: result,
				},
			}
		},
		cancelScheduledAutomation: async ({ headers, params }) => {
			checkAuthentication(headers.authorization)
			const { automationRunId } = params

			const community = await findCommunityBySlug()
			if (!community) {
				throw new NotFoundError("Community not found")
			}

			const result = await cancelScheduledAutomation(
				automationRunId,
				community.id as CommunitiesId
			)

			return {
				status: result.success ? 200 : 400,
				body: {
					success: result.success,
				},
			}
		},
		runWebhookAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization)
			const { automationId } = params
			const { json, stack } = body

			const community = await findCommunityBySlug()
			if (!community) {
				throw new NotFoundError("Community not found")
			}

			logger.info({
				msg: "Running webhook automation",
				automationId,
				stack,
				communityId: community.id,
			})

			const result = await runAutomation({
				automationId: automationId as AutomationsId,
				json: json as any,
				trigger: {
					event: AutomationEvent.webhook,
					config: null,
				},
				manualActionInstancesOverrideArgs: null,
				communityId: community.id as CommunitiesId,
				stack: stack as unknown as AutomationRunsId[],
			})

			return {
				status: 200,
				body: {
					automationId,
					result: result,
				},
			}
		},
	},
	{
		handlerType: "app-router",
		jsonQuery: true,
		errorHandler: tsRestHandleErrors,
	}
)

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT }
