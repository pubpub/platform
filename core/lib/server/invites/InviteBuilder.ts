import crypto from "node:crypto";

import type { ActionRunsId, CommunitiesId, FormsId, PubsId, StagesId, UsersId } from "db/public";
import type { Invite, LastModifiedBy } from "db/types";
import { InviteStatus, MemberRole } from "db/public";
import { newInviteSchema } from "db/types";
import { expect } from "utils";

import { db } from "~/kysely/database";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { maybeWithTrx } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import * as Email from "~/lib/server/email";
import { getUser } from "~/lib/server/user";

const BYTES_LENGTH = 16;

const DEFAULT_EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

/**
 * These steps ca be "shortcut" to at different places.
 * It's useful to define them separately to make sure we are implementing them the same
 * and so that the JSDoc stays the same
 */

interface ExpiresStep {
	/**
	 * Set the expiration date  to the default
	 * After this you will need to create and/or send the invite
	 */
	expiresDefault(): CreateBuilder;

	/**
	 * Set the expiration date to a specific date
	 * After this you will need to create and/or send the invite
	 */
	expires(date: Date): CreateBuilder;

	/**
	 * Set the expiration date to a specific number of days from now
	 * After this you will need to create and/or send the invite
	 */
	expiresInDays(days: number): CreateBuilder;
}

interface WithMessageStep {
	/**
	 * Specify a custom message to include in the invite. This will overwrite the default text of the invite.
	 *
	 * Defaults are (user is not yet member):
	 * - Community only: "You are invited to join {community} on {platform}." (if memberrole !== contributor) + "as a {memberrole}"
	 * - Pub: "You are invited to join {community} on {platform} and {MemberRole} to {pub}."
	 * - Form: "You are invited to join {community} on {platform} and fill out {form}."
	 * - Stage: "You are invited to join {community} on {platform} and {memberole} to {stage}."
	 *
	 * Defaults are (user is already member):
	 * - Community only: "You are invited to become a {memberrole} of {community} on {platform}."
	 * - Pub: "You are invited to become a {MemberRole} to {pub}."
	 * - Form: "You are invited to become a {MemberRole} to fill out {form}."
	 * - Stage: "You are invited to become a {MemberRole} to {stage}."
	 *
	 * If a user is creating the invite directly, instead of "You are invited", it will say "{User} invited you"
	 */
	withMessage(message: string): ExpiresBuilder;
}

/**
 * Do not call this class directly. Use the static methods on {@link InviteService} instead.
 */
export class InviteBuilderBase {
	static create(): InviteBuilderBase {
		return new InviteBuilderBase({
			status: InviteStatus.pending,
			expiresAt: DEFAULT_EXPIRES_AT,
		});
	}

	constructor(private inviteData: Pick<Invite, "status" | "expiresAt">) {}

	forEmail(email: string): InvitedByBuilder {
		return new InvitedByBuilder({
			...this.inviteData,
			email,
			userId: null,
		});
	}

	forUser(userId: UsersId): InvitedByBuilder {
		return new InvitedByBuilder({
			...this.inviteData,
			userId,
			email: null,
		});
	}
}

class InvitedByBuilder {
	constructor(private inviteData: Pick<Invite, "status" | "expiresAt" | "email" | "userId">) {}

	invitedByUserId(userId: UsersId): InviteBuilderWithUser {
		return new InviteBuilderWithUser({
			...this.inviteData,
			invitedByUserId: userId,
			invitedByActionRunId: null,
		});
	}

	invitedByActionRunId(actionRunId: ActionRunsId): InviteBuilderWithUser {
		return new InviteBuilderWithUser({
			...this.inviteData,
			invitedByActionRunId: actionRunId,
			invitedByUserId: null,
		});
	}
}

/**
 * After specifying user you must specify a community
 */
class InviteBuilderWithUser {
	constructor(
		private inviteData: Pick<
			Invite,
			"email" | "userId" | "status" | "expiresAt" | "invitedByUserId" | "invitedByActionRunId"
		>
	) {}

	/**
	 * The community the user should be invited to
	 */
	forCommunity(communityId: CommunitiesId): InviteBuilderWithCommunity {
		return new InviteBuilderWithCommunity({
			...this.inviteData,
			communityId,
		});
	}
}

/**
 * After specifying community you may specify a role
 */
class InviteBuilderWithCommunity implements ExpiresStep, WithMessageStep {
	constructor(
		private inviteData: Pick<
			Invite,
			| "email"
			| "userId"
			| "communityId"
			| "status"
			| "expiresAt"
			| "invitedByUserId"
			| "invitedByActionRunId"
		> & {
			communityRole?: MemberRole;
			communityLevelFormId?: FormsId;
		}
	) {}

	/**
	 * The role the user should gain in the community.
	 * By default the user will be invited as a contributor.
	 */
	as(role: MemberRole): Omit<InviteBuilderWithCommunity, "as"> {
		// creating a new instance but removing the 'as' method to prevent multiple calls
		const builder = new InviteBuilderWithCommunity({
			...this.inviteData,
			communityRole: role,
		});

		// remove the 'as' method
		delete (builder as any).as;
		if (this.inviteData.communityLevelFormId) {
			delete (builder as any).withForm;
		}
		return builder as Omit<InviteBuilderWithCommunity, "as">;
	}

	forPub(pubId: PubsId): PubStageAsTargetBuilder {
		return new PubStageAsTargetBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			pubId,
			communityLevelFormId: null,
			stageId: null,
		});
	}

	/**
	 * The form the user should be invited to
	 * You don't need to specify a role
	 */
	withForm(formId: FormsId) {
		const builder = new InviteBuilderWithCommunity({
			...this.inviteData,
			communityLevelFormId: formId,
		});

		if (this.inviteData.communityRole) {
			// remove the 'as' method
			delete (builder as any).as;
		}

		delete (builder as any).withForm;
		return builder as Omit<InviteBuilderWithCommunity, "as">;
	}

	/**
	 * The stage the user should be invited to
	 * You will need to specify a role
	 */
	forStage(stageId: StagesId): PubStageAsTargetBuilder {
		return new PubStageAsTargetBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			stageId,
			pubId: null,
			communityLevelFormId: null,
		});
	}

	/**
	 * Do not invite the user to a specific object, just to the community
	 */
	withMessage(message: string): ExpiresBuilder {
		return new ExpiresBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			message,
			pubId: null,
			communityLevelFormId: null,
			pubOrStageFormId: null,
			pubOrStageRole: null,
			stageId: null,
		});
	}

	expiresDefault(): CreateBuilder {
		return new CreateBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			message: null,
			pubId: null,
			communityLevelFormId: null,
			pubOrStageFormId: null,
			stageId: null,
			pubOrStageRole: null,
			expiresAt: DEFAULT_EXPIRES_AT,
		});
	}

	expires(date: Date): CreateBuilder {
		return new CreateBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			message: null,
			pubId: null,
			communityLevelFormId: null,
			pubOrStageFormId: null,
			stageId: null,
			pubOrStageRole: null,
			expiresAt: date,
		});
	}

	expiresInDays(days: number): CreateBuilder {
		return new CreateBuilder({
			communityRole: MemberRole.contributor,
			...this.inviteData,
			message: null,
			pubId: null,
			communityLevelFormId: null,
			pubOrStageFormId: null,
			stageId: null,
			pubOrStageRole: null,
			expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
		});
	}
}

// After specifying pub/stage
class PubStageAsTargetBuilder {
	constructor(
		private inviteData: Pick<
			Invite,
			| "email"
			| "userId"
			| "communityId"
			| "pubId"
			| "stageId"
			| "communityRole"
			| "status"
			| "expiresAt"
			| "invitedByUserId"
			| "invitedByActionRunId"
			| "communityLevelFormId"
		> & {
			pubOrStageFormId?: FormsId;
		}
	) {}

	withForm(formId: FormsId) {
		const builder = new PubStageAsTargetBuilder({
			...this.inviteData,
			pubOrStageFormId: formId,
		});

		// remove the 'as' method
		delete (builder as any).as;
		return builder as Omit<PubStageAsTargetBuilder, "as">;
	}

	as(role: MemberRole): WithMessageBuilder {
		return new WithMessageBuilder({
			// gets overrden by this.inviteData if set
			pubOrStageFormId: null,
			...this.inviteData,
			pubOrStageRole: role,
		});
	}
}

/**
 * Specify a custom message
 */
class WithMessageBuilder implements WithMessageStep {
	constructor(
		private inviteData: Pick<
			Invite,
			| "email"
			| "userId"
			| "communityId"
			| "pubId"
			| "stageId"
			| "communityLevelFormId"
			| "pubOrStageFormId"
			| "pubOrStageRole"
			| "communityRole"
			| "status"
			| "expiresAt"
			| "invitedByUserId"
			| "invitedByActionRunId"
		>
	) {}

	withMessage(message: string): ExpiresBuilder {
		return new ExpiresBuilder({
			...this.inviteData,
			message,
		});
	}
}

// After specifying message
class ExpiresBuilder implements ExpiresStep {
	constructor(
		private inviteData: Pick<
			Invite,
			| "email"
			| "userId"
			| "communityId"
			| "pubId"
			| "stageId"
			| "communityLevelFormId"
			| "pubOrStageFormId"
			| "pubOrStageRole"
			| "communityRole"
			| "message"
			| "invitedByUserId"
			| "invitedByActionRunId"
			| "status"
			| "expiresAt"
		>
	) {}

	expiresDefault(): CreateBuilder {
		return new CreateBuilder({
			...this.inviteData,
			expiresAt: DEFAULT_EXPIRES_AT,
		});
	}

	expires(date: Date): CreateBuilder {
		return new CreateBuilder({
			...this.inviteData,
			expiresAt: date,
		});
	}

	expiresInDays(days: number): CreateBuilder {
		return new CreateBuilder({
			...this.inviteData,
			expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
		});
	}
}

// Final stage for creation
class CreateBuilder {
	constructor(
		private inviteData: Pick<
			Invite,
			| "invitedByUserId"
			| "invitedByActionRunId"
			| "communityLevelFormId"
			| "pubOrStageFormId"
			| "pubId"
			| "stageId"
			| "communityId"
			| "pubOrStageRole"
			| "communityRole"
			| "message"
			| "expiresAt"
			| "email"
			| "userId"
		>
	) {}

	async create(trx = db): Promise<Invite> {
		const data = this.validateInputInviteData();

		const token = this.generateUniqueToken();

		const lastModifiedBy = data.invitedByUserId
			? createLastModifiedBy({ userId: data.invitedByUserId })
			: createLastModifiedBy({ actionRunId: expect(data.invitedByActionRunId) });

		const invite = await trx
			.insertInto("invites")
			.values({
				...data,
				token,
				lastModifiedBy,
			})
			.returningAll()
			.$narrowType<Invite>()
			.executeTakeFirstOrThrow();

		return invite;
	}

	async createAndSend(trx = db): Promise<Invite> {
		const result = await maybeWithTrx(trx, async (trx) => {
			const invitePromise = this.create(trx);

			const userPromise = this.inviteData.userId
				? getUser({ id: this.inviteData.userId }, trx).executeTakeFirstOrThrow()
				: ((await getUser(
						{ email: expect(this.inviteData.email) },
						trx
					).executeTakeFirst()) ?? { email: expect(this.inviteData.email) });
			const communityPromise = findCommunityBySlug();

			const [invite, user, community] = await Promise.all([
				invitePromise,
				userPromise,
				communityPromise,
			]);

			// Send email
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

		return result;
	}

	/**
	 * @throws {ZodError} if the invite data is invalid
	 */
	private validateInputInviteData() {
		newInviteSchema.parse(this.inviteData);
		return this.inviteData;
	}

	private generateUniqueToken(): string {
		return crypto.randomBytes(BYTES_LENGTH).toString("base64url");
	}
}
