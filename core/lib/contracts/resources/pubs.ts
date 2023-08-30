import { z } from "zod";
import { initContract } from "@ts-rest/core";

const contract = initContract();

const PubFieldsSchema = z.any();

const PubPostSchema = z.object({
	pubTypeId: z.string(),
	pubFields: PubFieldsSchema,
});

export type PubFieldsResponse = z.infer<typeof PubFieldsSchema>;
export type PubPostBody = z.infer<typeof PubPostSchema>;

export const pubApi = contract.router({
	createPub: {
		method: "POST",
		path: "integrations/:instanceId/pubs",
		summary: "Creates a new pub",
		description: "A way to create a new pub",
		body: PubPostSchema,
		pathParams: z.object({
			instanceId: z.string(),
		}),
		responses: {
			200: PubFieldsSchema,
			404: z.object({ message: z.string() }),
		},
	},
	getPub: {
		method: "GET",
		path: "integrations/:instanceId/pubs/:pubId",
		summary: "Gets a pub",
		description: "A way to get pubs fields for an integration instance",
		pathParams: z.object({
			pubId: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(PubFieldsSchema),
		},
	},
	getAllPubs: {
		method: "GET",
		path: "integrations/:instanceId/pubs",
		summary: "Gets all pubs for this instance",
		description: "A way to get all pubs for an integration instance",
		pathParams: z.object({
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(PubFieldsSchema),
		},
	},
	updatePub: {
		method: "PATCH",
		path: "integrations/:instanceId/pubs/:pubId",
		summary: "Adds field(s) to a pub",
		description: "A way to update a field for an existing pub",
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
