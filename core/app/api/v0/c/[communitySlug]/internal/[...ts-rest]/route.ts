import { createNextHandler } from "@ts-rest/serverless/next";

import type { ActionInstancesId, Event, PubsId, StagesId } from "db/public";
import { api } from "contracts";

import { runInstancesForEvent } from "~/actions/_lib/runActionInstance";
import { scheduleActionInstances } from "~/actions/_lib/scheduleActionInstance";
import { runActionInstance } from "~/actions/api/server";
import { compareAPIKeys, getBearerToken } from "~/lib/authentication/api";
import { env } from "~/lib/env/env.mjs";
import { tsRestHandleErrors } from "~/lib/server";

const checkAuthentication = (authHeader: string) => {
	const apiKey = getBearerToken(authHeader);
	compareAPIKeys(env.API_KEY, apiKey);
};

const handler = createNextHandler(
	api.internal,
	{
		triggerAction: async ({ headers, params, body }) => {
			checkAuthentication(headers.authorization);
			const { pubId, event } = body;

			const { actionInstanceId } = params;

			const actionRunResults = await runActionInstance({
				pubId: pubId as PubsId,
				event: event as Event,
				actionInstanceId: actionInstanceId as ActionInstancesId,
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

			const actionRunResults = await runInstancesForEvent(
				pubId as PubsId,
				stageId as StagesId,
				event as Event
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

			const actionScheduleResults = await scheduleActionInstances({
				pubId: pubId as PubsId,
				stageId: stageId as StagesId,
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

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
