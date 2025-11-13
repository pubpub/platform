import { createNextHandler } from "@ts-rest/serverless/next";

import type { ActionRunsId, AutomationsId, CommunitiesId, PubsId } from "db/public";
import { api } from "contracts";
import { AutomationEvent } from "db/public";
import { logger } from "logger";

import { runAutomationById } from "~/actions/_lib/runActionInstance";
import {
	cancelScheduledAutomationByActionRunId,
	scheduleDelayedAutomation,
} from "~/actions/_lib/scheduleActionInstance";
import { compareAPIKeys, getBearerToken } from "~/lib/authentication/api";
import { env } from "~/lib/env/env";
import { NotFoundError, tsRestHandleErrors } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader);
	compareAPIKeys(env.API_KEY, apiKey);
};

const handler = createNextHandler(
	api.internal,
	{
		runAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { automationId } = params;
			const { pubId, event, stack } = body;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			logger.info({
				msg: "Running automation",
				automationId,
				pubId,
				event,
				stack,
				communityId: community.id,
			});

			const result = await runAutomationById({
				automationId: automationId as AutomationsId,
				pubId: pubId as PubsId,
				event: event as AutomationEvent,
				communityId: community.id as CommunitiesId,
				stack: stack as unknown as ActionRunsId[],
			});

			return {
				status: 200,
				body: {
					automationId,
					actionInstanceId: result.actionInstanceId,
					result: result.result,
				},
			};
		},
		scheduleDelayedAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { automationId } = params;
			const { pubId, stack } = body;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			logger.info({
				msg: "Scheduling delayed automation",
				automationId,
				pubId,
				stack,
				communityId: community.id,
			});

			const result = await scheduleDelayedAutomation({
				automationId: automationId as AutomationsId,
				pubId: pubId as PubsId,
				stack: stack as ActionRunsId[],
			});

			return {
				status: 200,
				body: result,
			};
		},
		runDelayedAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { automationId } = params;
			const { pubId, event, actionRunId, stack, config } = body;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			logger.info({
				msg: "Running delayed automation",
				automationId,
				pubId,
				event,
				actionRunId,
				stack,
				communityId: community.id,
			});

			const result = await runAutomationById({
				automationId: automationId as AutomationsId,
				pubId: pubId as PubsId,
				event: event as AutomationEvent,
				communityId: community.id as CommunitiesId,
				stack: stack as unknown as ActionRunsId[],
				scheduledActionRunId: actionRunId,
				actionInstanceArgs: config ?? null,
			});

			return {
				status: 200,
				body: {
					automationId,
					result: result.result,
				},
			};
		},
		cancelScheduledAutomation: async ({ headers, params }) => {
			checkAuthentication(headers.authorization);
			const { actionRunId } = params;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			const result = await cancelScheduledAutomationByActionRunId(actionRunId as any);

			return {
				status: result.success ? 200 : 400,
				body: {
					success: result.success,
				},
			};
		},
		runWebhookAutomation: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { automationId } = params;
			const { json, stack } = body;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			logger.info({
				msg: "Running webhook automation",
				automationId,
				stack,
				communityId: community.id,
			});

			const result = await runAutomationById({
				automationId: automationId as AutomationsId,
				json: json as any,
				event: AutomationEvent.webhook,
				communityId: community.id as CommunitiesId,
				stack: stack as ActionRunsId[],
			});

			return {
				status: 200,
				body: {
					automationId,
					result: result.result,
				},
			};
		},
	},
	{
		handlerType: "app-router",
		jsonQuery: true,
		errorHandler: tsRestHandleErrors,
	}
);

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
