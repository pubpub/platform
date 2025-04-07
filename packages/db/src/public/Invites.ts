import type { ColumnType, Insertable, Selectable, Updateable } from "kysely";

import { z } from "zod";

import type { LastModifiedBy } from "../types";
import type { ActionRunsId } from "./ActionRuns";
import type { CommunitiesId } from "./Communities";
import type { InviteStatus } from "./InviteStatus";
import type { MemberRole } from "./MemberRole";
import type { PubsId } from "./Pubs";
import type { StagesId } from "./Stages";
import type { UsersId } from "./Users";
import { actionRunsIdSchema } from "./ActionRuns";
import { communitiesIdSchema } from "./Communities";
import { inviteStatusSchema } from "./InviteStatus";
import { memberRoleSchema } from "./MemberRole";
import { modifiedByTypeSchema } from "./ModifiedByType";
import { pubsIdSchema } from "./Pubs";
import { stagesIdSchema } from "./Stages";
import { usersIdSchema } from "./Users";

// @generated
// This file is automatically generated by Kanel. Do not modify manually.

/** Identifier type for public.invites */
export type InvitesId = string & { __brand: "InvitesId" };

/** Represents the table public.invites */
export interface InvitesTable {
	id: ColumnType<InvitesId, InvitesId | undefined, InvitesId>;

	email: ColumnType<string | null, string | null, string | null>;

	userId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	token: ColumnType<string, string, string>;

	expiresAt: ColumnType<Date, Date | string, Date | string>;

	createdAt: ColumnType<Date, Date | string | undefined, Date | string>;

	updatedAt: ColumnType<Date, Date | string | undefined, Date | string>;

	communityId: ColumnType<CommunitiesId, CommunitiesId, CommunitiesId>;

	communityRole: ColumnType<MemberRole, MemberRole | undefined, MemberRole>;

	pubId: ColumnType<PubsId | null, PubsId | null, PubsId | null>;

	stageId: ColumnType<StagesId | null, StagesId | null, StagesId | null>;

	message: ColumnType<string | null, string | null, string | null>;

	lastSentAt: ColumnType<Date | null, Date | string | null, Date | string | null>;

	status: ColumnType<InviteStatus, InviteStatus | undefined, InviteStatus>;

	invitedByUserId: ColumnType<UsersId | null, UsersId | null, UsersId | null>;

	invitedByActionRunId: ColumnType<ActionRunsId | null, ActionRunsId | null, ActionRunsId | null>;

	lastModifiedBy: ColumnType<LastModifiedBy, LastModifiedBy, LastModifiedBy>;
}

/**
 * @deprecated Use {@link Invite} instead
 */
export type Invites = Selectable<InvitesTable>;

/**
 * @deprecated Use {@link InviteInput} instead
 */
export type NewInvites = Insertable<InvitesTable>;

export type InvitesUpdate = Updateable<InvitesTable>;

export const invitesIdSchema = z.string().uuid() as unknown as z.Schema<InvitesId>;

export const invitesSchema = z.object({
	id: invitesIdSchema,
	email: z.string().nullable(),
	userId: usersIdSchema.nullable(),
	token: z.string(),
	expiresAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
	communityId: communitiesIdSchema,
	communityRole: memberRoleSchema,
	pubId: pubsIdSchema.nullable(),
	stageId: stagesIdSchema.nullable(),
	message: z.string().nullable(),
	lastSentAt: z.date().nullable(),
	status: inviteStatusSchema,
	invitedByUserId: usersIdSchema.nullable(),
	invitedByActionRunId: actionRunsIdSchema.nullable(),
	lastModifiedBy: modifiedByTypeSchema,
});

export const invitesInitializerSchema = z.object({
	id: invitesIdSchema.optional(),
	email: z.string().optional().nullable(),
	userId: usersIdSchema.optional().nullable(),
	token: z.string(),
	expiresAt: z.date(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema,
	communityRole: memberRoleSchema.optional(),
	pubId: pubsIdSchema.optional().nullable(),
	stageId: stagesIdSchema.optional().nullable(),
	message: z.string().optional().nullable(),
	lastSentAt: z.date().optional().nullable(),
	status: inviteStatusSchema.optional(),
	invitedByUserId: usersIdSchema.optional().nullable(),
	invitedByActionRunId: actionRunsIdSchema.optional().nullable(),
	lastModifiedBy: modifiedByTypeSchema,
});

export const invitesMutatorSchema = z.object({
	id: invitesIdSchema.optional(),
	email: z.string().optional().nullable(),
	userId: usersIdSchema.optional().nullable(),
	token: z.string().optional(),
	expiresAt: z.date().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	communityId: communitiesIdSchema.optional(),
	communityRole: memberRoleSchema.optional(),
	pubId: pubsIdSchema.optional().nullable(),
	stageId: stagesIdSchema.optional().nullable(),
	message: z.string().optional().nullable(),
	lastSentAt: z.date().optional().nullable(),
	status: inviteStatusSchema.optional(),
	invitedByUserId: usersIdSchema.optional().nullable(),
	invitedByActionRunId: actionRunsIdSchema.optional().nullable(),
	lastModifiedBy: modifiedByTypeSchema.optional(),
});
