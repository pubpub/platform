import { initContract } from "@ts-rest/core";
import { z } from "zod";

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
			path: "/actions/:stageId/trigger",
			summary: "Run all actions in a stage whose rules match the event",
			description:
				"Flock's emitEvent job uses this endpoint to run jobs in response to asynchronous events",
			pathParams: z.object({
				stageId: z.string(),
			}),
			body: z.object({
				event: z.enum(["pubLeftStage", "pubEnteredStage", "pubInStageForDuration"]),
				pubId: z.string(),
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
		pathPrefix: "/internal",
		baseHeaders: z.object({
			authorization: z.string(),
		}),
	}
);
