import { z } from "zod";

import type { Invites } from "../public";
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
	usersSchema,
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
		communityFormIds: formsIdSchema.array().nullable(),
		/**
		 * The message that is sent in the invite.
		 * This is optional because the user may not need a message.
		 */
		message: z.string().nullable(),
		lastModifiedBy: lastModifiedBySchema,
		/**
		 * The to-be-invited user
		 */
		userId: usersIdSchema,
		user: usersSchema.omit({
			passwordHash: true,
		}),
	})

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
				pubRole: memberRoleSchema,
				pubFormIds: formsIdSchema.array().nullable(),
				stageId: z.null(),
				stage: z.null(),
				stageRole: z.null(),
				stageFormIds: formsIdSchema.array().nullable(),
			}),
			z.object({
				pubId: z.null(),
				pub: z.null(),
				pubRole: z.null(),
				pubFormIds: formsIdSchema.array().nullable(),
				stageId: stagesIdSchema,
				stage: z.object({
					id: stagesIdSchema,
					name: z.string(),
				}),
				stageRole: memberRoleSchema,
				stageFormIds: formsIdSchema.array().nullable(),
			}),
			z.object({
				pubId: z.null(),
				pub: z.null(),
				pubRole: z.null(),
				pubFormIds: formsIdSchema.array().nullable(),
				stageId: z.null(),
				stage: z.null(),
				stageRole: z.null(),
				stageFormIds: formsIdSchema.array().nullable(),
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
					InviteStatus.completed,
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

// 30 days
export const DEFAULT_INVITE_EXPIRATION_TIME = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 12);

export const newInviteSchema = z
	.object({
		id: invitesIdSchema.optional(),
		token: z.string(),

		expiresAt: z.date().default(DEFAULT_INVITE_EXPIRATION_TIME),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),

		communityId: communitiesIdSchema,
		communityRole: memberRoleSchema.default(MemberRole.contributor),
		communityFormIds: formsIdSchema.array().nullish(),
		communityFormSlugs: z.string().array().nullish(),
		message: z.string().nullish(),
		lastModifiedBy: lastModifiedBySchema,
	})
	.and(
		// ProvisionalUser
		z.union([
			z.object({
				provisionalUser: z.null().optional(),
				userId: usersIdSchema,
			}),
			z.object({
				provisionalUser: z.object({
					firstName: z.string(),
					lastName: z.string(),
					email: z.string(),
				}),
				userId: z.null().optional(),
			}),
		])
	)
	.and(
		// PubOrStage - make pubOrStageRole optional when pub/stage is set
		z.union([
			z.object({
				pubId: pubsIdSchema,
				pubFormIds: formsIdSchema.array().optional(),
				pubFormSlugs: z.string().array().optional(),
				pubRole: memberRoleSchema,
				stageId: z.null().optional(),
				stageFormIds: z.null().optional(),
				stageFormSlugs: z.null().optional(),
				stageRole: z.null().optional(),
			}),
			z.object({
				pubId: z.null().optional(),
				pubFormIds: z.null().optional(),
				pubFormSlugs: z.null().optional(),
				pubRole: z.null().optional(),
				stageId: stagesIdSchema,
				stageFormIds: formsIdSchema.array().nullish(),
				stageFormSlugs: z.string().array().nullish(),
				stageRole: memberRoleSchema.optional(),
			}),
			z.object({
				pubId: z.null().optional(),
				pubFormIds: z.null().optional(),
				pubFormSlugs: z.null().optional(),
				pubRole: z.null().optional(),
				stageId: z.null().optional(),
				stageFormIds: z.null().optional(),
				stageFormSlugs: z.null().optional(),
				stageRole: z.null().optional(),
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
		z.union([
			z.object({
				lastSentAt: z.coerce.date(),
				status: z.enum([
					InviteStatus.accepted,
					InviteStatus.pending,
					InviteStatus.rejected,
					InviteStatus.revoked,
					InviteStatus.completed,
				]),
			}),
			z.object({
				lastSentAt: z.null().optional(),
				status: z.literal(InviteStatus.created).default(InviteStatus.created),
			}),
		])
	);

export type NewInviteInput = Prettify<z.input<typeof newInviteSchema>>;
export type NewInvite = Prettify<z.infer<typeof newInviteSchema>>;
