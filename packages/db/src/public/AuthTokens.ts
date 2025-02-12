import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { AuthTokenType } from "./AuthTokenType";
import type { UsersId } from "./Users";
import { authTokenTypeSchema } from "./AuthTokenType";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.auth_tokens */
export type AuthTokensId = string & { __brand: "AuthTokensId" };

/** Represents the table public.auth_tokens */
export interface AuthTokensTable {
	id: ColumnType<AuthTokensId, AuthTokensId | undefined, AuthTokensId>;

	hash: ColumnType<string, string, string>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	expiresAt: ColumnType<Date, Date | string, Date | string>;

	isUsed: ColumnType<boolean, boolean | undefined, boolean>;

	userId: ColumnType<UsersId, UsersId, UsersId>;

	type: ColumnType<AuthTokenType, AuthTokenType | undefined, AuthTokenType>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type AuthTokens = Selectable<AuthTokensTable>;

export type NewAuthTokens = Insertable<AuthTokensTable>;

export type AuthTokensUpdate = Updateable<AuthTokensTable>;

export const authTokensIdSchema = z.string().uuid() as unknown as z.Schema<AuthTokensId>;

export const authTokensSchema = z.object({
	id: authTokensIdSchema,
	hash: z.string(),
	createdAt: z.date(),
	expiresAt: z.date(),
	isUsed: z.boolean(),
	userId: usersIdSchema,
	type: authTokenTypeSchema,
	updatedAt: z.date(),
});

export const authTokensInitializerSchema = z.object({
	id: authTokensIdSchema.optional(),
	hash: z.string(),
	createdAt: z.date().optional(),
	expiresAt: z.date(),
	isUsed: z.boolean().optional(),
	userId: usersIdSchema,
	type: authTokenTypeSchema.optional(),
	updatedAt: z.date().optional(),
});

export const authTokensMutatorSchema = z.object({
	id: authTokensIdSchema.optional(),
	hash: z.string().optional(),
	createdAt: z.date().optional(),
	expiresAt: z.date().optional(),
	isUsed: z.boolean().optional(),
	userId: usersIdSchema.optional(),
	type: authTokenTypeSchema.optional(),
	updatedAt: z.date().optional(),
});
