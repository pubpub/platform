import { initContract } from "@ts-rest/core";
import { z } from "zod";

// Json value types taken from prisma
export type JsonObject = { [Key in string]?: JsonValue };
export interface JsonArray extends Array<JsonValue> {}
export type JsonValue = string | number | boolean | JsonObject | JsonArray | null;
export type InputJsonObject = { readonly [Key in string]?: InputJsonValue | null };
interface InputJsonArray extends ReadonlyArray<InputJsonValue | null> {}
type InputJsonValue =
	| string
	| number
	| boolean
	| InputJsonObject
	| InputJsonArray
	| { toJSON(): unknown };

export type JsonInput = InputJsonValue;
export const JsonInput: z.ZodType<JsonInput> = z.lazy(() =>
	z.union([
		z.union([z.string(), z.number(), z.boolean()]),
		z.array(JsonInput),
		z.record(JsonInput),
	])
);
export type JsonOutput = JsonValue;
export const JsonOutput = JsonInput as z.ZodType<JsonOutput>;

const commonPubFields = z.object({
	pubTypeId: z.string(),
	parentId: z.string().optional().nullable(),
});

// Get pub types

export const GetPubResponseBodyBase = commonPubFields.extend({
	id: z.string(),
	values: z.record(JsonOutput),
});
export type GetPubResponseBody = z.infer<typeof GetPubResponseBodyBase> & {
	children: GetPubResponseBody[];
};
export const GetPubResponseBody: z.ZodType<GetPubResponseBody> = GetPubResponseBodyBase.extend({
	children: z.lazy(() => GetPubResponseBody.array()),
});

// Create pub types

const CreatePubRequestBodyBase = commonPubFields.extend({
	id: z.string().optional(),
	values: z.record(JsonInput),
});
export type CreatePubRequestBody = z.infer<typeof CreatePubRequestBodyBase> & {
	children?: CreatePubRequestBody[];
};
export const CreatePubRequestBody: z.ZodType<CreatePubRequestBody> =
	CreatePubRequestBodyBase.extend({
		children: z.lazy(() => CreatePubRequestBody.array().optional()),
	});

export const CreatePubResponseBodyBase = commonPubFields.extend({
	id: z.string(),
});
export type CreatePubResponseBody = z.infer<typeof CreatePubResponseBodyBase> & {
	children: CreatePubResponseBody[];
};
export const CreatePubResponseBody: z.ZodType<CreatePubResponseBody> =
	CreatePubResponseBodyBase.extend({
		children: z.lazy(() => CreatePubResponseBody.array()),
	});

// Update pub types

const UpdatePubRequestBodyBase = commonPubFields.extend({
	id: z.string(),
	values: z.record(JsonInput),
});
export type UpdatePubRequestBody = z.infer<typeof UpdatePubRequestBodyBase> & {
	children: UpdatePubRequestBody[];
};
export const UpdatePubRequestBody: z.ZodType<UpdatePubRequestBody> =
	UpdatePubRequestBodyBase.extend({
		children: z.lazy(() => UpdatePubRequestBody.array()),
	});

export const UpdatePubResponseBodyBase = commonPubFields.extend({
	id: z.string(),
});
export type UpdatePubResponseBody = z.infer<typeof UpdatePubResponseBodyBase> & {
	children: UpdatePubResponseBody[];
};
export const UpdatePubResponseBody: z.ZodType<UpdatePubResponseBody> =
	CreatePubResponseBodyBase.extend({
		children: z.lazy(() => CreatePubResponseBody.array()),
	});

// Member suggestion types

export const SuggestedMembers = z.object({
	id: z.string(),
	name: z.string(),
});
export type SuggestedMembers = z.infer<typeof SuggestedMembers>;

// Auth types

export const User = z.object({
	id: z.string(),
	slug: z.string(),
	email: z.string(),
	name: z.string(),
	avatar: z.string().nullable(),
});
export type User = z.infer<typeof User>;

// Email types

export const SendEmailRequestBody = z.object({
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
});
export type SendEmailRequestBody = z.infer<typeof SendEmailRequestBody>;
export const SendEmailResponseBody = z.object({
	accepted: z.array(z.string()),
	rejected: z.array(z.string()),
});
export type SendEmailResponseBody = z.infer<typeof SendEmailResponseBody>;

// PubType Types

export const GetPubTypeResponseBody = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	fields: z
		.array(
			z.object({
				id: z.string(),
				name: z.string(),
				slug: z.string(),
				schema: z
					.object({
						id: z.string(),
						namespace: z.string(),
						name: z.string(),
						schema: JsonOutput,
					})
					.nullable(),
			})
		)
		.nullable(),
});

export type GetPubTypeResponseBody = z.infer<typeof GetPubTypeResponseBody>;

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
				200: User,
			},
		},
		createPub: {
			method: "POST",
			path: "/:instanceId/pubs",
			summary: "Creates a new pub",
			description: "A way to create a new pub",
			body: CreatePubRequestBody,
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: CreatePubResponseBody,
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
			query: z.object({
				depth: z.string().optional(),
			}),
			responses: {
				200: GetPubResponseBody,
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
				501: z.object({
					error: z.string(),
				}),
			},
		},
		updatePub: {
			method: "PATCH",
			path: "/:instanceId/pubs/:pubId",
			summary: "Adds field(s) to a pub",
			description: "A way to update a field for an existing pub",
			body: UpdatePubRequestBody,
			pathParams: z.object({
				pubId: z.string(),
				instanceId: z.string(),
			}),
			responses: {
				200: UpdatePubResponseBody,
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
				200: z.array(SuggestedMembers),
			},
		},
		sendEmail: {
			method: "POST",
			path: "/:instanceId/email",
			summary: "Send an email from PubPub to a new or existing PubPub user",
			description:
				"Recipient can be an existing pubpub user identified by ID, or a new user who must be identified by email and name.",
			body: SendEmailRequestBody,
			pathParams: z.object({
				instanceId: z.string(),
			}),
			responses: {
				200: SendEmailResponseBody,
			},
		},
		getPubType: {
			method: "GET",
			path: "/:instanceId/pubTypes/:pubTypeId",
			summary: "Get a pubType and its fields and schemas",
			description: "",
			pathParams: z.object({
				instanceId: z.string(),
				pubTypeId: z.string(),
			}),
			responses: {
				200: GetPubTypeResponseBody,
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
		// 		200: z.array(SuggestedMembers),
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
