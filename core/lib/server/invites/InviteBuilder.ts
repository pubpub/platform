import crypto from "node:crypto";

import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { ActionRunsId, CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import type { Invite } from "db/types";
import { InviteFormType, InviteStatus, MemberRole } from "db/public";
import { newInviteSchema } from "db/types";
import { expect } from "utils";

import { db } from "~/kysely/database";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { maybeWithTrx } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import * as Email from "~/lib/server/email";
import { getUser } from "~/lib/server/user";
import { autoRevalidate } from "../cache/autoRevalidate";
import { withInvitedFormIds } from "./helpers";

const BYTES_LENGTH = 16;

const DEFAULT_EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// Required initial steps
interface InvitedByStep {
	invitedBy(inviter: { userId: UsersId } | { actionRunId: ActionRunsId }): CommunityStep;
}

interface CommunityStep {
	forCommunity(communityId: CommunitiesId): CommunityRoleOrTargetStep;
}

// After community, can either set community role or choose a target (pub/stage)
interface CommunityRoleOrTargetStep extends PubStageStep {
	withRole(role: MemberRole): WithFormsStep & PubStageStep;
}

interface PubStageStep {
	forPub(pubId: PubsId): PubStageRoleStep;
	forStage(stageId: StagesId): PubStageRoleStep;
}

interface WithFormsStep extends OptionalStep {
	withForms(formIds: FormsId[]): OptionalStep;
}

// If pub/stage is chosen, must set role
interface PubStageRoleStep {
	withRole(role: MemberRole): WithFormsStep;
}

// All optional steps after required steps are complete
interface OptionalStep {
	withMessage(message: string): OptionalStep;
	expiresAt(date: Date): OptionalStep;
	expiresInDays(days: number): OptionalStep;
	create(trx?: typeof db): Promise<Invite>;
	createAndSend(trx?: typeof db): Promise<Invite>;
}

export class InviteBuilder
	implements
		InvitedByStep,
		CommunityStep,
		CommunityRoleOrTargetStep,
		PubStageRoleStep,
		OptionalStep
{
	private data: Partial<Invite> = {
		status: InviteStatus.created,
		expiresAt: DEFAULT_EXPIRES_AT,
		communityRole: MemberRole.contributor,
	};

	// private constructor to force using static methods
	private constructor() {}

	static inviteByEmail(email: string): InvitedByStep {
		const builder = new InviteBuilder();
		builder.data.email = email;
		builder.data.userId = null;
		return builder;
	}

	static inviteByUser(userId: UsersId): InvitedByStep {
		const builder = new InviteBuilder();
		builder.data.userId = userId;
		builder.data.email = null;
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

	forCommunity(communityId: CommunitiesId): CommunityRoleOrTargetStep {
		this.data.communityId = communityId;
		return this;
	}

	forPub(pubId: PubsId): PubStageRoleStep {
		this.data.pubId = pubId;
		this.data.stageId = null;
		return this;
	}

	forStage(stageId: StagesId): PubStageRoleStep {
		this.data.stageId = stageId;
		this.data.pubId = null;
		return this;
	}

	withRole(role: MemberRole): WithFormsStep {
		if (this.data.pubId || this.data.stageId) {
			this.data.pubOrStageRole = role;
		} else {
			this.data.communityRole = role;
		}
		return this;
	}

	withMessage(message: string): OptionalStep {
		this.data.message = message;
		return this;
	}

	withForms(formIds: FormsId[]): OptionalStep {
		if (this.data.pubId || this.data.stageId) {
			this.data.pubOrStageFormIds = formIds;
		} else {
			this.data.communityLevelFormIds = formIds;
		}
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

	private validate(data: Partial<Invite>) {
		return newInviteSchema.parse(data);
	}

	async create(trx = db): Promise<Invite> {
		const token = this.generateToken();

		this.data.token = token;

		const lastModifiedBy = this.data.invitedByUserId
			? createLastModifiedBy({ userId: this.data.invitedByUserId })
			: createLastModifiedBy({ actionRunId: expect(this.data.invitedByActionRunId) });

		this.data.lastModifiedBy = lastModifiedBy;

		const type =
			this.data.pubId || this.data.stageId
				? InviteFormType.pubOrStage
				: this.data.communityLevelFormIds
					? InviteFormType.communityLevel
					: null;

		const { communityLevelFormIds, pubOrStageFormIds, ...preValidatedData } = this.data;

		const data = this.validate(preValidatedData);

		const inviteBase = trx.with("invite", (db) =>
			db
				.insertInto("invites")
				.values({
					...data,
					token,
					lastModifiedBy,
				})
				.returningAll()
		);

		const inviteWithForms = type
			? inviteBase.with("invite_forms", (db) =>
					db
						.insertInto("invite_forms")
						.values((eb) => [
							...(pubOrStageFormIds?.map((formId) => ({
								inviteId: eb
									.selectFrom("invite")
									.select("id")
									.where("token", "=", token)
									.limit(1),
								formId,
								type: InviteFormType.pubOrStage,
							})) ?? []),
							...(communityLevelFormIds?.map((formId) => ({
								inviteId: eb
									.selectFrom("invite")
									.select("id")
									.where("token", "=", token)
									.limit(1),
								formId,
								type: InviteFormType.communityLevel,
							})) ?? []),
						])
						.returningAll()
				)
			: inviteBase;

		// for type safety this cast is necessary
		const inviteFinal = (inviteWithForms as typeof inviteBase)
			.selectFrom("invite")
			.selectAll()
			.select(withInvitedFormIds);

		const result = await autoRevalidate(inviteFinal).executeTakeFirstOrThrow();

		return result as Invite;
	}

	async createAndSend(trx = db): Promise<Invite> {
		return maybeWithTrx(trx, async (trx) => {
			const invitePromise = this.create(trx);

			const userPromise = this.data.userId
				? getUser({ id: this.data.userId }, trx).executeTakeFirstOrThrow()
				: ((await getUser({ email: expect(this.data.email) }, trx).executeTakeFirst()) ?? {
						email: expect(this.data.email),
					});

			const communityPromise = findCommunityBySlug();

			const [invite, user, community] = await Promise.all([
				invitePromise,
				userPromise,
				communityPromise,
			]);

			await Email.signupInvite(
				{
					user,
					community: expect(community),
				},
				trx
			).send();

			await trx
				.updateTable("invites")
				.set({
					lastSentAt: new Date(),
				})
				.where("id", "=", invite.id)
				.execute();

			return invite;
		});
	}
}
