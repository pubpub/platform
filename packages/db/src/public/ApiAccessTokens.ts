import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { CommunitiesId } from "./Communities";
import type { UsersId } from "./Users";
import { communitiesIdSchema } from "./Communities";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.api_access_tokens */
export type ApiAccessTokensId = string & { __brand: "ApiAccessTokensId" };

/** Represents the table public.api_access_tokens */
export interface ApiAccessTokensTable {
	id: ColumnType<ApiAccessTokensId, ApiAccessTokensId | undefined, ApiAccessTokensId>;

	token: ColumnType<string, string, string>;

	name: ColumnType<string, string, string>;

	description: ColumnType<string | null, string | null, string | null>;

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

	expiration: ColumnType<Date, Date | string, Date | string>;

	issuedById: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	issuedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type ApiAccessTokens = Selectable<ApiAccessTokensTable>;

export type NewApiAccessTokens = Insertable<ApiAccessTokensTable>;

export type ApiAccessTokensUpdate = Updateable<ApiAccessTokensTable>;

export const apiAccessTokensIdSchema = z.string().uuid() as unknown as z.Schema<ApiAccessTokensId>;

export const apiAccessTokensSchema = z.object({
	id: apiAccessTokensIdSchema,
	token: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	communityId: communitiesIdSchema,
	expiration: z.date(),
	issuedById: usersIdSchema.nullable(),
	issuedAt: z.date(),
	updatedAt: z.date(),
});

export const apiAccessTokensInitializerSchema = z.object({
	id: apiAccessTokensIdSchema.optional(),
	token: z.string(),
	name: z.string(),
	description: z.string().optional().nullable(),
	communityId: communitiesIdSchema,
	expiration: z.date(),
	issuedById: usersIdSchema.optional().nullable(),
	issuedAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const apiAccessTokensMutatorSchema = z.object({
	id: apiAccessTokensIdSchema.optional(),
	token: z.string().optional(),
	name: z.string().optional(),
	description: z.string().optional().nullable(),
	communityId: communitiesIdSchema.optional(),
	expiration: z.date().optional(),
	issuedById: usersIdSchema.optional().nullable(),
	issuedAt: z.date().optional(),
	updatedAt: z.date().optional(),
});
