import { z } from "zod";
import { initContract } from "@ts-rest/core";

const contract = initContract();

const PubFieldsSchema = z.any();

const PubPostSchema = z.object({
	pubTypeId: z.string(),
	pubFields: PubFieldsSchema,
});
const SuggestedMembersSchema = z.object({
	id: z.string(),
	name: z.string(),
});

export type PubFieldsResponse = z.infer<typeof PubFieldsSchema>;
export type PubPostBody = z.infer<typeof PubPostSchema>;
export type SuggestedMember = z.infer<typeof SuggestedMembersSchema>;

export const integrationsApi = contract.router({
	createPub: {
		method: "POST",
		path: "/integrations/:instanceId/pubs",
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
		path: "/integrations/:instanceId/pubs/:pubId",
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
		path: "/integrations/:instanceId/pubs",
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
		path: "/integrations/:instanceId/pubs/:pubId",
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
	getSuggestedMembers: {
		method: "GET",
		path: "/integrations/:instanceId/autosuggest/members/:memberCandidateString",
		summary: "autosuggest member",
		description:
			"A way to autosuggest members so that integrations users can find users or verify they exist. Will return a name for ",
		pathParams: z.object({
			memberCandidateString: z.string(),
			instanceId: z.string(),
		}),
		responses: {
			200: z.array(SuggestedMembersSchema),
		},
	},
	// TODO implement these endpoints
	// authorizeIntegration: {
	// 	method: "POST",
	// 	path: "integrations/:instanceId/authorize",
	// 	summary: "authorize integration",
	// 	description: "A way to authorize an integration",
	// 	body: z.object({
	// 		userId: z.string(),
	// 	}),
	// 	pathParams: z.object({
	// 		instanceId: z.string(),
	// 	}),
	// 	responses: {
	// 		200: z.any(),
	// 	},
	// },
	// getAllMembers: {
	// 	method: "GET",
	// 	path: "integrations/:instanceId/members",
	// 	summary: "Gets all members for this instance",
	// 	description: "A way to get all members for an integration instance",
	// 	pathParams: z.object({
	// 		instanceId: z.string(),
	// 	}),
	// 	responses: {
	// 		200: z.array(SuggestedMembersSchema),
	// 	},
	// },
	// postEmail: {
	// 	method: "POST",
	// 	path: "integrations/:instanceId/email",
	// 	summary: "Send email",
	// 	description: "A way to send email",
	// 	body: z.object({
	// 		userId: z.string(),
	// 		subject: z.string(),
	// 		body: z.string(),
	// 		recipients: z.array(z.string()),
	// 	}),
	// 	pathParams: z.object({
	// 		instanceId: z.string(),
	// 	}),
	// 	responses: {
	// 		200: z.any(),
	// 	},
	// },
});
