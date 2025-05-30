import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { FormsId } from "./Forms";
import type { MemberGroupsId } from "./MemberGroups";
import type { MemberRole } from "./MemberRole";
import type { StagesId } from "./Stages";
import type { UsersId } from "./Users";
import { formsIdSchema } from "./Forms";
import { memberGroupsIdSchema } from "./MemberGroups";
import { memberRoleSchema } from "./MemberRole";
import { stagesIdSchema } from "./Stages";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.stage_memberships */
export type StageMembershipsId = string & { __brand: "StageMembershipsId" };

/** Represents the table public.stage_memberships */
export interface StageMembershipsTable {
	id: ColumnType<StageMembershipsId, StageMembershipsId | undefined, StageMembershipsId>;

	role: ColumnType<MemberRole, MemberRole, MemberRole>;

	stageId: ColumnType<StagesId, StagesId, StagesId>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	memberGroupId: ColumnType<MemberGroupsId | null, MemberGroupsId | null, MemberGroupsId | null>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	formId: ColumnType<FormsId | null, FormsId | null, FormsId | null>;
}

export type StageMemberships = Selectable<StageMembershipsTable>;

export type NewStageMemberships = Insertable<StageMembershipsTable>;

export type StageMembershipsUpdate = Updateable<StageMembershipsTable>;

export const stageMembershipsIdSchema = z
	.string()
	.uuid() as unknown as z.Schema<StageMembershipsId>;

export const stageMembershipsSchema = z.object({
	id: stageMembershipsIdSchema,
	role: memberRoleSchema,
	stageId: stagesIdSchema,
	userId: usersIdSchema.nullable(),
	memberGroupId: memberGroupsIdSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	formId: formsIdSchema.nullable(),
});

export const stageMembershipsInitializerSchema = z.object({
	id: stageMembershipsIdSchema.optional(),
	role: memberRoleSchema,
	stageId: stagesIdSchema,
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	formId: formsIdSchema.optional().nullable(),
});

export const stageMembershipsMutatorSchema = z.object({
	id: stageMembershipsIdSchema.optional(),
	role: memberRoleSchema.optional(),
	stageId: stagesIdSchema.optional(),
	userId: usersIdSchema.optional().nullable(),
	memberGroupId: memberGroupsIdSchema.optional().nullable(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	formId: formsIdSchema.optional().nullable(),
});
