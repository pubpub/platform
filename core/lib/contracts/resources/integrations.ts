import { Prisma } from "@prisma/client";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

type Json = Prisma.InputJsonValue;
const Json: z.ZodType<Json> = z.lazy(() =>
	z.union([z.union([z.string(), z.number(), z.boolean()]), z.array(Json), z.record(Json)])
);

const PubValuesSchema = z.record(Json);

const BaseCreatePubBody = z.object({
	id: z.string().optional(),
	parentId: z.string().optional(),
	pubTypeId: z.string(),
	values: PubValuesSchema,
});

export type CreatePubBody = z.infer<typeof BaseCreatePubBody> & {
	children?: CreatePubBody[];
};

export const CreatePubBody: z.ZodType<CreatePubBody> = BaseCreatePubBody.extend({
	children: z.lazy(() => CreatePubBody.array().optional()),
});

const SuggestedMembersSchema = z.object({
	id: z.string(),
	name: z.string(),
});

const UserSchema = z.object({
	id: z.string(),
	slug: z.string(),
	email: z.string(),
	name: z.string(),
	avatar: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type PubFieldsResponse = z.infer<typeof PubValuesSchema>;
export type SuggestedMember = z.infer<typeof SuggestedMembersSchema>;

const contract = initContract();

export const integrationsApi = contract.router(
	{
		auth: {
			method: "GET",
			path: "/:instanceId/auth",
			summary: "Authenticate a user and receive basic information about them",
			description:
				"Integrations can use this endpoint to exchange a PubPub community member's auth token for information about them.",
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: UserSchema,
			},
		},
		createPub: {
			method: "POST",
			path: "/:instanceId/pubs",
			summary: "Creates a new pub",
			description: "A way to create a new pub",
			body: CreatePubBody,
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: z.any(),
				404: z.object({ message: z.string() }),
			},
		},
		getPub: {
			method: "GET",
			path: "/:instanceId/pubs/:pubId",
			summary: "Gets a pub",
			description: "A way to get pubs fields for an integration instance",
			pathParams: z.object({
				pubId: z.string(),
				instanceId: z.string(),
			}),
			responses: {
				200: z.array(PubValuesSchema),
			},
		},
		getAllPubs: {
			method: "GET",
			path: "/:instanceId/pubs",
			summary: "Gets all pubs for this instance",
			description: "A way to get all pubs for an integration instance",
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: z.array(PubValuesSchema),
			},
		},
		updatePub: {
			method: "PATCH",
			path: "/:instanceId/pubs/:pubId",
			summary: "Adds field(s) to a pub",
			description: "A way to update a field for an existing pub",
			body: PubValuesSchema,
			pathParams: z.object({
				pubId: z.string(),
				instanceId: z.string(),
			}),
			responses: {
				200: PubValuesSchema,
			},
		},
		getSuggestedMembers: {
			method: "GET",
			path: "/:instanceId/autosuggest/members/:memberCandidateString",
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
		sendEmail: {
			method: "POST",
			path: "/:instanceId/email",
			summary: "Send an email from PubPub to a new or existing PubPub user",
			description:
				"Recipient can be an existing pubpub user identified by ID, or a new user who must be identified by email and name.",
			body: z.object({
				to: z.union([
					z.object({
						userId: z.string(),
					}),
					z.object({
						email: z.string(),
						name: z.string(),
					}),
				]),
				subject: z.string(),
				message: z.string(),
			}),
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: z.undefined(),
			},
		},
		// TODO implement these endpoints
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
	},
	{
		pathPrefix: "/integrations",
		baseHeaders: z.object({
			authorization: z.string(),
		}),
	}
);
