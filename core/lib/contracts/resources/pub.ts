import { z } from "zod";
import { initContract } from "@ts-rest/core";

const contract = initContract();

const PubFieldsSchema = z.any();

export type PubFieldsResponse = z.infer<typeof PubFieldsSchema>;

export const pubApi = contract.router({
	createPubFields: {
		method: "POST",
		path: "/:instanceId/pub",
		summary: "Creates a new pub",
		description: "A way to create a new pub",
		body: PubFieldsSchema,
		pathParams: z.object({
			instanceId: z.string(),
		}),
		responses: {
			200: PubFieldsSchema,
		},
	},
	getPubFields: {
		method: "GET",
		path: "/:instanceId/pub/:pubId",
		summary: "Get all pubs",
		description: "A way to get a pubs fields for an integration instance",
		pathParams: z.object({
			pubId: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(PubFieldsSchema),
		},
	},
	putPubFields: {
		method: "PATCH",
		path: "/:instanceId/pub/:pubId",
		summary: "Adds field(s) to a pub",
		description: "A way to add a field to an existing pub",
		body: PubFieldsSchema,
		pathParams: z.object({
			pubId: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: PubFieldsSchema,
		},
	},
});
