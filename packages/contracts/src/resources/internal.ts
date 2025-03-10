import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { actionInstancesIdSchema, actionRunsIdSchema, eventSchema, pubsIdSchema } from "db/public";

const contract = initContract();

export const internalApi = contract.router(
	{
		scheduleAction: {
			method: "POST",
			path: "/actions/:stageId/schedule",
			summary: "Schedule an action to run",
			description: "Schedule an action to run on a Pub in a stage to run at a later time.",
			pathParams: z.object({
				stageId: z.string(),
			}),
			body: z.object({
				pubId: z.string(),
			}),
			responses: {
				200: z.array(
					z.object({
						actionInstanceName: z.string(),
						actionInstanceId: z.string(),
						runAt: z.string(),
						result: z.any(),
					})
				),
			},
		},
		triggerAction: {
			method: "POST",
			path: "/actions/:actionInstanceId/trigger/",
			summary: "Run a specific action instance in a stage for a specific pub",
			description:
				"Flock's emitEvent job uses this endpoint to run jobs in response to asynchronous events",
			pathParams: z.object({
				actionInstanceId: z.string(),
			}),
			body: z.object({
				pubId: pubsIdSchema,
				event: eventSchema,
				stack: z.array(actionRunsIdSchema).optional(),
				scheduledActionRunId: actionRunsIdSchema.optional(),
			}),
			responses: {
				200: z.object({
					actionInstanceId: z.string(),
					result: z.any(),
				}),
			},
		},
		triggerActions: {
			method: "POST",
			path: "/stages/:stageId/actions/trigger",
			summary: "Run all actions in a stage whose rules match the event",
			description:
				"Flock's emitEvent job uses this endpoint to run jobs in response to asynchronous events",
			pathParams: z.object({
				stageId: z.string(),
			}),
			body: z.object({
				pubId: pubsIdSchema,
				event: eventSchema,
				watchedActionInstanceId: actionInstancesIdSchema.optional(),
			}),
			responses: {
				200: z.array(
					z.object({
						actionInstanceName: z.string(),
						actionInstanceId: z.string(),
						result: z.any(),
					})
				),
			},
		},
	},
	{
		pathPrefix: "/api/v0/c/:communitySlug/internal",
		baseHeaders: z.object({
			authorization: z.string(),
		}),
	}
);
