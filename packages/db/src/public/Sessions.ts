import type { ColumnType, Insertable, Selectable, Updateable } from "kysely"

import { z } from "zod"

import type { AuthTokenType } from "./AuthTokenType"
import type { UsersId } from "./Users"
import { authTokenTypeSchema } from "./AuthTokenType"
import { usersIdSchema } from "./Users"

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.sessions */
export type SessionsId = string & { __brand: "SessionsId" }

/** Represents the table public.sessions */
export interface SessionsTable {
	id: ColumnType<SessionsId, SessionsId | undefined, SessionsId>

	userId: ColumnType<UsersId, UsersId, UsersId>

	expiresAt: ColumnType<Date, Date | string, Date | string>

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>

	/** With what type of token is this session created? Used for determining on a page-by-page basis whether to allow a certain session to access it. For instance, a verify email token/session should not allow you to access the password reset page. */
	type: ColumnType<AuthTokenType, AuthTokenType | undefined, AuthTokenType>
}

export type Sessions = Selectable<SessionsTable>

export type NewSessions = Insertable<SessionsTable>

export type SessionsUpdate = Updateable<SessionsTable>

export const sessionsIdSchema = z.string().uuid() as unknown as z.Schema<SessionsId>

export const sessionsSchema = z.object({
	id: sessionsIdSchema,
	userId: usersIdSchema,
	expiresAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
	type: authTokenTypeSchema,
})

export const sessionsInitializerSchema = z.object({
	id: sessionsIdSchema.optional(),
	userId: usersIdSchema,
	expiresAt: z.date(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	type: authTokenTypeSchema.optional(),
})

export const sessionsMutatorSchema = z.object({
	id: sessionsIdSchema.optional(),
	userId: usersIdSchema.optional(),
	expiresAt: z.date().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	type: authTokenTypeSchema.optional(),
})
