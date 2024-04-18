import { initContract } from "@ts-rest/core";
import { z } from "zod";

const contract = initContract();

export const internalApi = contract.router(
	{
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
				event: z.enum(["pubLeftStage", "pubEnteredStage"]),
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
