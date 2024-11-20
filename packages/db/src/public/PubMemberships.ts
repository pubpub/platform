import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { MemberGroupsId } from "./MemberGroups";
import type { MemberRole } from "./MemberRole";
import type { PubsId } from "./Pubs";
import type { UsersId } from "./Users";
import { memberGroupsIdSchema } from "./MemberGroups";
import { memberRoleSchema } from "./MemberRole";
import { pubsIdSchema } from "./Pubs";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.pub_memberships */
export type PubMembershipsId = string & { __brand: "PubMembershipsId" };

/** Represents the table public.pub_memberships */
export interface PubMembershipsTable {
	id: ColumnType<PubMembershipsId, PubMembershipsId | undefined, PubMembershipsId>;

	role: ColumnType<MemberRole, MemberRole, MemberRole>;

	pubId: ColumnType<PubsId, PubsId, PubsId>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	memberGroupId: ColumnType<MemberGroupsId | null, MemberGroupsId | null, MemberGroupsId | null>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type PubMemberships = Selectable<PubMembershipsTable>;

export type NewPubMemberships = Insertable<PubMembershipsTable>;

export type PubMembershipsUpdate = Updateable<PubMembershipsTable>;

export const pubMembershipsIdSchema = z.string().uuid() as unknown as z.Schema<PubMembershipsId>;

export const pubMembershipsSchema = z.object({
	id: pubMembershipsIdSchema,
	role: memberRoleSchema,
	pubId: pubsIdSchema,
	userId: usersIdSchema.nullable(),
	memberGroupId: memberGroupsIdSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const pubMembershipsInitializerSchema = z.object({
	id: pubMembershipsIdSchema.optional(),
	role: memberRoleSchema,
	pubId: pubsIdSchema,
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const pubMembershipsMutatorSchema = z.object({
	id: pubMembershipsIdSchema.optional(),
	role: memberRoleSchema.optional(),
	pubId: pubsIdSchema.optional(),
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});
