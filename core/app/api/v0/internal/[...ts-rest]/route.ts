import { revalidateTag } from "next/cache";
import { createNextHandler } from "@ts-rest/serverless/next";

import { api } from "contracts";

import type Event from "~/kysely/types/public/Event";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { runInstancesForEvent } from "~/actions/_lib/runActionInstance";
import { scheduleActionInstances } from "~/actions/_lib/scheduleActionInstance";
import { compareAPIKeys, getBearerToken } from "~/lib/auth/api";
import { env } from "~/lib/env/env.mjs";
import { findCommunityIdByPubId } from "~/lib/server/community";

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader);
	compareAPIKeys(env.API_KEY, apiKey);
};

const handler = createNextHandler(
	api.internal,
	{
		triggerAction: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { event, pubId } = body;

			const { stageId } = params;

			const communityIdPromise = findCommunityIdByPubId(pubId as PubsId);

			const actionRunResultsPromise = runInstancesForEvent(
				pubId as PubsId,
				stageId as StagesId,
				event as Event
			);

			const [communityId, actionRunResults] = await Promise.all([
				communityIdPromise,
				actionRunResultsPromise,
			]);

			if (communityId) {
				revalidateTag(`community-action-runs_${communityId}`);
			}

			return {
				status: 200,
				body: actionRunResults,
			};
		},
		scheduleAction: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { pubId } = body;
			const { stageId } = params;

			const communityIdPromise = findCommunityIdByPubId(pubId as PubsId);
			const actionScheduleResultsPromise = scheduleActionInstances({
				pubId: pubId as PubsId,
				stageId: stageId as StagesId,
			});

			const [communityId, actionScheduleResults] = await Promise.all([
				communityIdPromise,
				actionScheduleResultsPromise,
			]);

			if (communityId) {
				revalidateTag(`community-action-runs_${communityId}`);
			}

			return {
				status: 200,
				body: actionScheduleResults ?? [],
			};
		},
	},
	{
		handlerType: "app-router",
		// handlerType: 'pages-router-edge',

		// rest of options
		basePath: "/api/v0",
		jsonQuery: true,
	}
);

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
