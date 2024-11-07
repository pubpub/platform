import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { CommunitiesId } from "./Communities";
import type { MemberGroupsId } from "./MemberGroups";
import type { MemberRole } from "./MemberRole";
import type { UsersId } from "./Users";
import { communitiesIdSchema } from "./Communities";
import { memberGroupsIdSchema } from "./MemberGroups";
import { memberRoleSchema } from "./MemberRole";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.community_memberships */
export type CommunityMembershipsId = string & { __brand: "CommunityMembershipsId" };

/** Represents the table public.community_memberships */
export interface CommunityMembershipsTable {
	id: ColumnType<
		CommunityMembershipsId,
		CommunityMembershipsId | undefined,
		CommunityMembershipsId
	>;

	role: ColumnType<MemberRole, MemberRole, MemberRole>;

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	memberGroupId: ColumnType<MemberGroupsId | null, MemberGroupsId | null, MemberGroupsId | null>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;
}

export type CommunityMemberships = Selectable<CommunityMembershipsTable>;

export type NewCommunityMemberships = Insertable<CommunityMembershipsTable>;

export type CommunityMembershipsUpdate = Updateable<CommunityMembershipsTable>;

export const communityMembershipsIdSchema = z
	.string()
	.uuid() as unknown as z.Schema<CommunityMembershipsId>;

export const communityMembershipsSchema = z.object({
	id: communityMembershipsIdSchema,
	role: memberRoleSchema,
	communityId: communitiesIdSchema,
	userId: usersIdSchema.nullable(),
	memberGroupId: memberGroupsIdSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const communityMembershipsInitializerSchema = z.object({
	id: communityMembershipsIdSchema.optional(),
	role: memberRoleSchema,
	communityId: communitiesIdSchema,
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const communityMembershipsMutatorSchema = z.object({
	id: communityMembershipsIdSchema.optional(),
	role: memberRoleSchema.optional(),
	communityId: communitiesIdSchema.optional(),
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});
