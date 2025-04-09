import { z } from "zod";

import type { Invites, NewInvites } from "../public";
import {
	actionRunsIdSchema,
	communitiesIdSchema,
	formsIdSchema,
	invitesIdSchema,
	MemberRole,
	memberRoleSchema,
	pubsIdSchema,
	pubTypesIdSchema,
	stagesIdSchema,
	usersIdSchema,
} from "../public";
import { InviteStatus } from "../public/InviteStatus";
import { lastModifiedBySchema } from "./LastModifiedBy";

export const inviteSchema = z
	.object({
		id: invitesIdSchema,
		token: z.string(),
		/**
		 * The date and time that the invite expires.
		 * Note: this will not change the status of the invite
		 * TODO: create some kind of cron-job that changes/deletes the invite on token expiration
		 */
		expiresAt: z.date(),
		createdAt: z.date(),
		updatedAt: z.date(),
		communityId: communitiesIdSchema,
		community: z.object({
			id: communitiesIdSchema,
			slug: z.string(),
			avatar: z.string().nullable(),
			name: z.string(),
		}),
		communityRole: memberRoleSchema,
		/**
		 * The form that is used to invite the user to the community.
		 * This is used to allow a user to fill out a form to join the community.
		 * This is optional because the user may not need access to a form
		 */
		communityLevelFormIds: formsIdSchema.array().nullable(),
		/**
		 * The message that is sent in the invite.
		 * This is optional because the user may not need a message.
		 */
		message: z.string().nullable(),
		lastModifiedBy: lastModifiedBySchema,
	})
	.and(
		// EmailOrUserId
		z.union([
			z.object({
				/**
				 * The email address of the to-be-invited user
				 */
				email: z.string().email(),
				/**
				 * Cannot set both email and userId
				 */
				userId: z.null(),
			}),
			z.object({
				/**
				 * Cannot set both email and userId
				 */
				email: z.null(),
				/**
				 * The to-be-invited user
				 */
				userId: usersIdSchema,
			}),
		])
	)
	.and(
		// PubOrStage
		z.union([
			z.object({
				pubId: pubsIdSchema,
				pub: z.object({
					id: pubsIdSchema,
					title: z.string().nullable(),
					pubType: z.object({
						id: pubTypesIdSchema,
						name: z.string(),
					}),
				}),
				pubOrStageFormIds: formsIdSchema.array().nullable(),
				stageId: z.null(),
				stage: z.null(),
				pubOrStageRole: memberRoleSchema,
			}),
			z.object({
				pubId: z.null(),
				pub: z.null(),
				pubOrStageFormIds: formsIdSchema.array().nullable(),
				stageId: stagesIdSchema,
				stage: z.object({
					id: stagesIdSchema,
					name: z.string(),
				}),
				pubOrStageRole: memberRoleSchema,
			}),
			z.object({
				pubId: z.null(),
				pub: z.null(),
				pubOrStageFormIds: z.null(),
				stageId: z.null(),
				stage: z.null(),
				pubOrStageRole: z.null(),
			}),
		])
	)
	.and(
		// InvitedBy
		z.union([
			z.object({
				invitedByUserId: usersIdSchema,
				invitedByActionRunId: z.null(),
			}),
			z.object({
				invitedByUserId: z.null(),
				invitedByActionRunId: actionRunsIdSchema,
			}),
		])
	)
	.and(
		// LastSentAtStatus
		z.union([
			z.object({
				/**
				 * The date and time that the invite was last sent.
				 */
				lastSentAt: z.coerce.date(),
				status: z.enum([
					InviteStatus.accepted,
					InviteStatus.pending,
					InviteStatus.rejected,
					InviteStatus.revoked,
				]),
			}),
			z.object({
				/**
				 * Null, bc the invite has not been sent yet
				 */
				lastSentAt: z.null(),
				status: z.literal(InviteStatus.created),
			}),
		])
	) satisfies z.ZodType<Invites>;

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type Invite = Prettify<z.infer<typeof inviteSchema>>;

const _typeTestFunc = () => {
	let invite = {} as Invite;
	let invite2 = {} as Invites;

	// this should be allowed, Invite should be a subtype of Invites
	invite2 = invite;
};

export const newInviteSchema = z
	.object({
		token: z.string().optional(),
		expiresAt: z.date(),
		communityId: communitiesIdSchema,

		id: invitesIdSchema.optional(),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
		communityRole: memberRoleSchema.default(MemberRole.contributor),
		communityLevelFormIds: formsIdSchema.array().nullable().optional(),
		message: z.string().nullable().optional(),
		lastModifiedBy: lastModifiedBySchema,
	})
	.and(
		// EmailOrUserId
		z.union([
			z.object({
				email: z.string(),
				userId: z.null().optional(),
			}),
			z.object({
				email: z.null().optional(),
				userId: usersIdSchema,
			}),
		])
	)
	.and(
		// PubOrStage - make pubOrStageRole optional when pub/stage is set
		z.union([
			z.object({
				pubId: pubsIdSchema,
				pubOrStageFormIds: formsIdSchema.array().nullable().optional(),
				stageId: z.null().optional(),
				pubOrStageRole: memberRoleSchema.optional(),
			}),
			z.object({
				pubId: z.null().optional(),
				pubOrStageFormIds: formsIdSchema.array().nullable().optional(),
				stageId: stagesIdSchema,
				pubOrStageRole: memberRoleSchema.optional(),
			}),
			z.object({
				pubId: z.null().optional(),
				pubOrStageFormIds: z.null().optional(),
				stageId: z.null().optional(),
				pubOrStageRole: z.null().optional(),
			}),
		])
	)
	.and(
		// InvitedBy
		z.union([
			z.object({
				invitedByUserId: usersIdSchema,
				invitedByActionRunId: z.null().optional(),
			}),
			z.object({
				invitedByUserId: z.null().optional(),
				invitedByActionRunId: actionRunsIdSchema,
			}),
		])
	)
	.and(
		// LastSentAtStatus - status is optional as it might have a default
		z.union([
			z.object({
				lastSentAt: z.coerce.date().optional(),
				status: z
					.enum([
						InviteStatus.accepted,
						InviteStatus.pending,
						InviteStatus.rejected,
						InviteStatus.revoked,
					])
					.optional(),
			}),
			z.object({
				lastSentAt: z.null().optional(),
				status: z.literal(InviteStatus.created).optional(),
			}),
		])
	) satisfies z.ZodType<NewInvites>;

// type helper to see what the input type looks like
export type NewInvite = z.infer<typeof newInviteSchema>;
