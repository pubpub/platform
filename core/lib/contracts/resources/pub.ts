import { z } from "zod";
import { initContract } from "@ts-rest/core";

const contract = initContract();

const PubFieldsSchema = z.any();

export type PubFieldsResponse = z.infer<typeof PubFieldsSchema>;

export const pubApi = contract.router({
	getPubFields: {
		method: "GET",
		path: "pubs/:instanceId/:pubId",
		summary: "Get all pubs",
		description: "A way to get every pub for an integration instance",
		pathParams: z.object({
			pubId: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(PubFieldsSchema),
		},
	},
	putPubFields: {
		method: "PUT",
		path: "pubs/:instanceId",
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
