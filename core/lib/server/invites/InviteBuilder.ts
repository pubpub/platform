import crypto from "node:crypto";

import type { UserId } from "lucia";

import type { ActionRunsId, CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import type { Invite, NewInvite } from "db/types";
import { formsIdSchema, InviteStatus, MemberRole } from "db/public";
import { newInviteSchema } from "db/types";
import { expect } from "utils";

import type { XOR } from "~/lib/types";
import { db } from "~/kysely/database";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { findCommunityBySlug } from "~/lib/server/community";
import * as Email from "~/lib/server/email";
import { maybeWithTrx } from "~/lib/server/maybeWithTrx";
import { addUser, generateUserSlug, getUser } from "~/lib/server/user";
import { InviteService } from "./InviteService";

const BYTES_LENGTH = 16;

const DEFAULT_EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// Required initial steps
export interface InvitedByStep {
	invitedBy(inviter: { userId: UsersId } | { actionRunId: ActionRunsId }): CommunityStep;
}

interface CommunityStep {
	forCommunity(communityId: CommunitiesId): WithRoleStep<PubStageStep> & PubStageStep;
}

type NextStep = OptionalStep | PubStageStep;

// After community, can either set community role or choose a target (pub/stage)
interface WithRoleStep<Next extends NextStep> {
	withRole(role: MemberRole): WithFormsStep<Next> & Next;
}

interface PubStageStep extends OptionalStep {
	forPub(pubId: PubsId): WithRoleStep<OptionalStep>;
	forStage(stageId: StagesId): WithRoleStep<OptionalStep>;
}

interface WithFormsStep<Next extends NextStep> extends OptionalStep {
	withForms(formIds: FormsId[]): Next;
	withForms(slugs: string[]): Next;
}

// If pub/stage is chosen, must set role

// All optional steps after required steps are complete
interface OptionalStep {
	withMessage(message: string): OptionalStep;
	expiresAt(date: Date): OptionalStep;
	expiresInDays(days: number): OptionalStep;
	create(trx?: typeof db): Promise<Invite>;
	createAndSend(input: { redirectTo: string }, trx?: typeof db): Promise<Invite>;
}

export type NewUser = {
	firstName: string;
	lastName: string;
	email: string;
};

type InviteBuilderData = XOR<{ userId: UserId }, { provisionalUser: NewUser }>;

export class InviteBuilder
	implements
		InvitedByStep,
		CommunityStep,
		WithRoleStep<NextStep>,
		WithFormsStep<NextStep>,
		PubStageStep,
		OptionalStep
{
	private data: Partial<NewInvite>;

	// private constructor to force using static methods
	private constructor(data: InviteBuilderData) {
		this.data = {
			...data,
			status: InviteStatus.created,
			expiresAt: DEFAULT_EXPIRES_AT,
			communityRole: MemberRole.contributor,
		};
	}

	/**
	 * Invite a user and create an account for them
	 */
	static inviteUser(user: NewUser): InvitedByStep;
	/**
	 * Invite a specific user
	 */
	static inviteUser(user: UsersId): InvitedByStep;
	static inviteUser(user: NewUser | UsersId): InvitedByStep {
		const data = typeof user === "string" ? { userId: user } : { provisionalUser: user };
		const builder = new InviteBuilder(data);

		return builder;
	}

	invitedBy(inviter: { userId: UsersId } | { actionRunId: ActionRunsId }): CommunityStep {
		if ("userId" in inviter) {
			this.data.invitedByUserId = inviter.userId;
			this.data.invitedByActionRunId = null;
		} else {
			this.data.invitedByActionRunId = inviter.actionRunId;
			this.data.invitedByUserId = null;
		}
		return this;
	}

	forCommunity(communityId: CommunitiesId): WithRoleStep<PubStageStep> & PubStageStep {
		this.data.communityId = communityId;
		return this as WithRoleStep<PubStageStep> & PubStageStep;
	}

	forPub(pubId: PubsId): WithRoleStep<OptionalStep> {
		this.data.pubId = pubId;
		this.data.stageId = null;
		return this;
	}

	forStage(stageId: StagesId): WithRoleStep<OptionalStep> {
		this.data.stageId = stageId;
		this.data.pubId = null;
		return this;
	}

	withRole(role: MemberRole): WithFormsStep<NextStep> & NextStep {
		if (this.data.pubId) {
			this.data.pubRole = role;
		} else if (this.data.stageId) {
			this.data.stageRole = role;
		} else {
			this.data.communityRole = role;
		}

		return this;
	}

	withForms(forms: FormsId[] | string[]): NextStep {
		const uuids = forms.map((form) => formsIdSchema.safeParse(form).data);

		const hasUuids = uuids.some((uuid) => uuid != null);
		const hasSlugs = uuids.some((slug) => slug == null);

		if (hasUuids && hasSlugs) {
			throw new Error("Cannot provide both uuids and slugs");
		}

		if (this.data.pubId) {
			if (hasUuids) {
				this.data.pubFormIds = uuids.filter((uuid) => uuid != null) as FormsId[];
			} else {
				this.data.pubFormSlugs = forms;
			}
		} else if (this.data.stageId) {
			if (hasUuids) {
				this.data.stageFormIds = uuids.filter((uuid) => uuid != null) as FormsId[];
			} else {
				this.data.stageFormSlugs = forms;
			}
		} else {
			if (hasUuids) {
				this.data.communityFormIds = uuids.filter((uuid) => uuid != null) as FormsId[];
			} else {
				this.data.communityFormSlugs = forms;
			}
		}
		return this as NextStep;
	}

	withMessage(message: string): OptionalStep {
		this.data.message = message;
		return this;
	}

	expiresAt(date: Date): OptionalStep {
		this.data.expiresAt = date;
		return this;
	}

	expiresInDays(days: number): OptionalStep {
		this.data.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
		return this;
	}

	private generateToken(): string {
		return crypto.randomBytes(BYTES_LENGTH).toString("base64url");
	}

	private validate() {
		const newData = newInviteSchema.parse(this.data) as NewInvite;
		this.data = newData;
		return newData;
	}

	async create(trx = db): Promise<Invite> {
		const token = this.generateToken();

		this.data.token = token;

		const lastModifiedBy = this.data.invitedByUserId
			? createLastModifiedBy({ userId: this.data.invitedByUserId })
			: createLastModifiedBy({ actionRunId: expect(this.data.invitedByActionRunId) });

		this.data.lastModifiedBy = lastModifiedBy;

		const data = this.validate();

		return InviteService._createInvite({ ...data, token: token, lastModifiedBy }, trx);
	}

	async createAndSend(input: { redirectTo: string }, trx = db): Promise<Invite> {
		return maybeWithTrx(trx, async (trx) => {
			const invitePromise = this.create(trx);

			const existingUserPromise = getUser(
				this.data.userId
					? { id: this.data.userId }
					: { email: expect(this.data.provisionalUser).email },
				trx
			).executeTakeFirstOrThrow();

			const communityPromise = findCommunityBySlug();

			const [invite, user, community] = await Promise.all([
				invitePromise,
				existingUserPromise,
				communityPromise,
			]);

			let toBeInvitedUserId = user?.id;

			if (!toBeInvitedUserId) {
				throw new Error("User not found");
			}

			const inviteLink = await InviteService.createInviteLink(invite, {
				redirectTo: input.redirectTo,
			});

			const props = invite.pubId
				? ({
						type: "pub",
						pub: expect(invite.pub),
						pubRole: invite.pubRole,
						communityRole: invite.communityRole,
					} as const)
				: invite.stageId
					? ({
							type: "stage",
							stage: expect(invite.stage),
							stageRole: invite.stageRole,
							communityRole: invite.communityRole,
						} as const)
					: ({
							type: "community",
							communityRole: invite.communityRole,
						} as const);

			await Email.signupInvite(
				{
					community: expect(community),
					to: user.email,
					inviteLink,
					...props,
				},
				trx
			).send();

			await trx
				.updateTable("invites")
				.set({
					status: InviteStatus.pending,
					lastSentAt: new Date(),
					lastModifiedBy: createLastModifiedBy(
						invite.invitedByActionRunId
							? { actionRunId: invite.invitedByActionRunId }
							: { userId: expect(invite.invitedByUserId) }
					),
				})
				.where("id", "=", invite.id)
				.execute();

			return invite;
		});
	}
}
