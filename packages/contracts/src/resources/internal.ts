import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { actionRunsIdSchema, automationsIdSchema, pubsIdSchema } from "db/public";

const contract = initContract();

export const internalApi = contract.router(
	{
		runAutomation: {
			method: "POST",
			path: "/automations/:automationId/run",
			summary: "Run a specific automation",
			description:
				"Run a single automation for a specific pub with a stack to prevent infinite loops",
			pathParams: z.object({
				automationId: automationsIdSchema,
			}),
			body: z.object({
				pubId: pubsIdSchema,
				event: eventSchema,
				stack: z.array(actionRunsIdSchema),
			}),
			responses: {
				200: z.object({
					automationId: z.string(),
					actionInstanceId: z.string(),
					result: z.any(),
				}),
			},
		},
		scheduleDelayedAutomation: {
			method: "POST",
			path: "/automations/:automationId/schedule-delayed",
			summary: "Schedule a delayed automation",
			description:
				"Schedule a specific time-based automation (pubInStageForDuration) for a pub entering a stage",
			pathParams: z.object({
				automationId: automationsIdSchema,
			}),
			body: z.object({
				pubId: pubsIdSchema,
				stack: z.array(actionRunsIdSchema),
			}),
			responses: {
				200: z.object({
					automationId: z.string(),
					actionInstanceName: z.string(),
					runAt: z.string(),
				}),
			},
		},
		runDelayedAutomation: {
			method: "POST",
			path: "/automations/:automationId/run-delayed",
			summary: "Run a delayed automation",
			description: "Run a previously scheduled time-based automation",
			pathParams: z.object({
				automationId: automationsIdSchema,
			}),
			body: z.object({
				pubId: pubsIdSchema,
				event: eventSchema,
				actionRunId: actionRunsIdSchema,
				stack: z.array(actionRunsIdSchema),
				config: z.record(z.unknown()).nullish(),
			}),
			responses: {
				200: z.object({
					automationId: z.string(),
					result: z.any(),
				}),
			},
		},
		cancelScheduledAutomation: {
			method: "POST",
			path: "/action-runs/:actionRunId/cancel",
			summary: "Cancel a scheduled action run",
			description: "Cancel a scheduled automation and mark the action run as cancelled",
			pathParams: z.object({
				actionRunId: actionRunsIdSchema,
			}),
			body: z.object({}),
			responses: {
				200: z.object({
					success: z.boolean(),
				}),
			},
		},
		runWebhookAutomation: {
			method: "POST",
			path: "/automations/:automationId/run-webhook",
			summary: "Run a webhook automation",
			description: "Run a webhook automation with arbitrary JSON input",
			pathParams: z.object({
				automationId: automationsIdSchema,
			}),
			body: z.object({
				json: z.record(z.unknown()),
				stack: z.array(actionRunsIdSchema),
			}),
			responses: {
				200: z.object({
					automationId: z.string(),
					result: z.any(),
				}),
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
