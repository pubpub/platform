import { z } from "zod";

import { pubsIdSchema } from "db/public";

// Auth types

export const SafeUser = z.object({
	id: z.string(),
	slug: z.string(),
	firstName: z.string(),
	lastName: z.string().nullable(),
	avatar: z.string().nullable(),
	createdAt: z.date(),
});
export type SafeUser = z.infer<typeof SafeUser>;

export const User = SafeUser.and(
	z.object({
		email: z.string(),
	})
);
export type User = z.infer<typeof User>;

// Json value types taken from prisma
export type JsonObject = { [Key in string]: JsonValue };
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

// @see: https://github.com/colinhacks/zod#json-type
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
export type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
	z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const commonPubFields = z.object({
	pubTypeId: z.string(),
	parentId: z.string().optional().nullable(),
});

// Get pub types

export const GetPubResponseBody = commonPubFields.extend({
	id: z.string(),
	values: z.record(JsonOutput),
	assignee: User.nullish(),
	communityId: z.string(),
	createdAt: z.date(),
});
export type GetPubResponseBody = z.infer<typeof GetPubResponseBody>;

// Create pub types

const CreatePubRequestBodyBase = commonPubFields.extend({
	id: z.string().optional(),
	values: z.record(JsonInput),
	assigneeId: z.string().optional(),
});
export type CreatePubRequestBody = z.infer<typeof CreatePubRequestBodyBase> & {
	children?: CreatePubRequestBody[];
};
export const CreatePubRequestBody: z.ZodType<CreatePubRequestBody> =
	CreatePubRequestBodyBase.extend({
		children: z.lazy(() => CreatePubRequestBody.array().optional()),
	});

// TODO: there has to be a better way to allow the API requests to include nulls in json fields
export const CreatePubRequestBodyWithNullsBase = commonPubFields.extend({
	id: z.string().optional(),
	values: z.record(
		z.union([jsonSchema, z.object({ value: jsonSchema, relatedPubId: pubsIdSchema }).array()])
	),
	assigneeId: z.string().optional(),
});

export type CreatePubRequestBodyWithNulls = z.infer<typeof CreatePubRequestBodyWithNullsBase> & {
	children?: CreatePubRequestBodyWithNulls[];
};
export const CreatePubRequestBodyWithNulls: z.ZodType<CreatePubRequestBodyWithNulls> =
	CreatePubRequestBodyWithNullsBase.extend({
		children: z.lazy(() => CreatePubRequestBodyWithNulls.array().optional()),
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
