import { createNextHandler } from "@ts-rest/serverless/next";

import type { ActionInstancesId, CommunitiesId, PubsId, StagesId } from "db/public";
import { api } from "contracts";
import { Event } from "db/public";

import { runInstancesForEvent } from "~/actions/_lib/runActionInstance";
import { scheduleActionInstances } from "~/actions/_lib/scheduleActionInstance";
import { runActionInstance } from "~/actions/api/server";
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
		triggerAction: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { pubId, event, stack, scheduledActionRunId } = body;

			const { actionInstanceId } = params;
			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			const actionRunResults = await runActionInstance({
				pubId: pubId,
				event: event,
				actionInstanceId: actionInstanceId as ActionInstancesId,
				communityId: community.id as CommunitiesId,
				stack: stack ?? [],
				scheduledActionRunId: scheduledActionRunId,
			});

			return {
				status: 200,
				body: { result: actionRunResults, actionInstanceId },
			};
		},
		triggerActions: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { event, pubId } = body;

			const { stageId } = params;

			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			const actionRunResults = await runInstancesForEvent(
				pubId as PubsId,
				stageId as StagesId,
				event as Event,
				community.id as CommunitiesId,
				[]
			);

			return {
				status: 200,
				body: actionRunResults,
			};
		},
		scheduleAction: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { pubId } = body;
			const { stageId } = params;
			const community = await findCommunityBySlug();
			if (!community) {
				throw new NotFoundError("Community not found");
			}

			const actionScheduleResults = await scheduleActionInstances({
				pubId: pubId as PubsId,
				stageId: stageId as StagesId,
				stack: [],
				event: Event.pubInStageForDuration,
			});

			return {
				status: 200,
				body: actionScheduleResults ?? [],
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
