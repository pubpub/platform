import type { ColumnType, Insertable, Selectable, Updateable } from "kysely"

import { z } from "zod"

import type { CommunitiesId } from "./Communities"
import { communitiesIdSchema } from "./Communities"

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.member_groups */
export type MemberGroupsId = string & { __brand: "MemberGroupsId" }

/** Represents the table public.member_groups */
export interface MemberGroupsTable {
	id: ColumnType<MemberGroupsId, MemberGroupsId | undefined, MemberGroupsId>

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>
}

export type MemberGroups = Selectable<MemberGroupsTable>

export type NewMemberGroups = Insertable<MemberGroupsTable>

export type MemberGroupsUpdate = Updateable<MemberGroupsTable>

export const memberGroupsIdSchema = z.string().uuid() as unknown as z.Schema<MemberGroupsId>

export const memberGroupsSchema = z.object({
	id: memberGroupsIdSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
	communityId: communitiesIdSchema,
})

export const memberGroupsInitializerSchema = z.object({
	id: memberGroupsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema,
})

export const memberGroupsMutatorSchema = z.object({
	id: memberGroupsIdSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema.optional(),
})
