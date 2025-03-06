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

export const CreatePubRequestBody = commonPubFields.extend({
	id: z.string().optional(),
	values: z.record(JsonInput),
	assigneeId: z.string().optional(),
});
export type CreatePubRequestBody = z.infer<typeof CreatePubRequestBody>;

// TODO: there has to be a better way to allow the API requests to include nulls in json fields
export const CreatePubRequestBodyWithNulls = commonPubFields.extend({
	id: z.string().optional(),
	values: z.record(
		z.union([jsonSchema, z.object({ value: jsonSchema, relatedPubId: pubsIdSchema }).array()])
	),
	assigneeId: z.string().optional(),
});

export type CreatePubRequestBodyWithNulls = z.infer<typeof CreatePubRequestBodyWithNulls>;

export const CreatePubResponseBody = commonPubFields.extend({
	id: z.string(),
});
export type CreatePubResponseBody = z.infer<typeof CreatePubResponseBody>;
