import type { CommunitiesId, CommunityMemberships, PubsId, StagesId, UsersId } from "db/public";
import type { Invite, LastModifiedBy } from "db/types";
import { InviteStatus } from "db/public";
import { compareMemberRoles } from "db/types";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";
import { autoCache } from "~/prisma/seed/stubs/stubs";
import { maybeWithTrx } from "..";
import { getLoginData } from "../../authentication/loginData";
import { getCommunitySlug } from "../cache/getCommunitySlug";
import {
	insertCommunityMember,
	insertPubMember,
	insertStageMember,
	selectCommunityMember,
} from "../member";
import { InviteBuilder } from "./InviteBuilder";

/**
 * Collection of methods for managing invites
 *
 * Maybe could also just be a module
 */
export namespace InviteService {
	//==============================================
	// Error classes
	//==============================================

	export class InviteError extends Error {
		constructor(message: string) {
			super(message);
		}
	}

	export class InviteNotFoundError extends InviteError {
		constructor(token: string, communityId: CommunitiesId) {
			super(`Invite not found: token=${token}, communityId=${communityId}`);
		}
	}

	export class InviteNotPendingError extends InviteError {
		constructor(token: string, communityId: CommunitiesId, status: InviteStatus) {
			super(
				`Tried to accept non-pending invite: token=${token}, communityId=${communityId}, status=${status}`
			);
		}
	}

	export class InviteNotForUserError extends InviteError {
		constructor(token: string, communityId: CommunitiesId, userId: UsersId) {
			super(
				`Tried to accept invite for another user: token=${token}, communityId=${communityId}, userId=${userId}`
			);
		}
	}

	export const assertUserIsInvitee = (
		invite: Invite,
		user: { id: UsersId; email: string } | null
	) => {
		if (!user) {
			throw new Error("No user found to match to invite");
		}

		if (invite.email && user.email !== invite.email) {
			throw new InviteNotForUserError(invite.token, invite.communityId, user.id);
		}

		if (invite.userId !== user.id) {
			throw new InviteNotForUserError(invite.token, invite.communityId, user.id);
		}
	};
	//==============================================

	/**
	 * Invite a non-user by email. If the email is already assigned to a user, that specific user will be invited instead.
	 */
	export function inviteEmail(email: string) {
		return InviteBuilder.inviteByEmail(email);
	}

	/**
	 * Invite a specific user
	 */
	export function inviteUser(userId: UsersId) {
		return InviteBuilder.inviteByUser(userId);
	}

	// The rest of the service methods for managing invites
	export async function getInviteByToken(token: string, communityId: CommunitiesId, trx = db) {
		return trx
			.selectFrom("invites")
			.where("token", "=", token)
			.where("communityId", "=", communityId)
			.selectAll()
			.executeTakeFirst() as Promise<Invite | null>;
	}

	/**
	 * Sets the status of an invite to accepted
	 * Will check whether the user is allowed to accept the invite: will prevent accepting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteError}
	 */
	export async function acceptInvite(
		token: string,
		communityId: CommunitiesId,
		lastModifiedBy: LastModifiedBy,
		trx = db
	) {
		const result = await maybeWithTrx(trx, async (trx) => {
			const invite = await getValidInviteForLoggedInUser(token, communityId);

			if (isCommunityOnlyInvite(invite)) {
				// grant user community membership based on the invite data as the highest role
			} else if (isPubInvite(invite)) {
				// grant user pub membership based on the invite data as the highest role
			} else if (isStageInvite(invite)) {
				// grant user stage membership based on the invite data as the highest role
			}

			await trx
				.updateTable("invites")
				.set({ status: InviteStatus.accepted, lastModifiedBy })
				.where("id", "=", invite.id)
				.execute();
		});

		return result;
	}

	/**
	 * Sets the status of an invite to reject
	 * Will check whether the user is allowed to reject the invite: will prevent rejecting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteError}
	 */
	export async function rejectInvite(
		token: string,
		communityId: CommunitiesId,
		lastModifiedBy: LastModifiedBy
	) {
		const invite = await getValidInviteForLoggedInUser(token, communityId);

		await db
			.updateTable("invites")
			.set({ status: InviteStatus.rejected, lastModifiedBy })
			.where("id", "=", invite.id)
			.execute();
	}

	/**
	 * Revokes an invite for another user
	 *
	 * TODO: implement
	 */
	export async function revokeInvite(token: string, communityId: CommunitiesId, reason?: string) {
		throw new Error("Not implemented");
	}

	/**
	 * @throws {InviteNotFoundError}
	 * @throws {InviteNotPendingError}
	 * @throws {InviteNotForUserError}
	 */
	async function getValidInviteForLoggedInUser(
		token: string,
		communityId: CommunitiesId,
		trx = db
	) {
		const [invite, { user }] = await Promise.all([
			getInviteByToken(token, communityId, trx),
			getLoginData(),
		]);

		if (!invite) {
			throw new InviteNotFoundError(token, communityId);
		}

		assertUserIsInvitee(invite, user);

		if (invite.status !== InviteStatus.pending) {
			throw new InviteNotPendingError(token, communityId, invite.status);
		}

		return invite;
	}

	/**
	 * User cannot be invited to a community if they are already a member of the community
	 */
	export async function canUserBeInvited(userId: UsersId, communityId: CommunitiesId, trx = db) {
		const communityMember = await selectCommunityMember(
			{ userId, communityId },
			trx
		).executeTakeFirst();

		return Boolean(communityMember);
	}

	/**
	 * Checks whether an invite is useless for a user
	 *
	 * This means that the invite would not grant any additional roles to the user
	 * This is only relevant when the user has already accepted another invite in the meantime.
	 * Currently there are no restrictions on number of open invites per user.
	 *
	 * @returns {Promise<{useless: false} | {useless: true, reason: string}>} true if the invite is useless, false otherwise
	 * @throws {InviteError} if the invite is not pending
	 */
	export async function isInviteUselessForUser(
		invite: Invite,
		user: { id: UsersId; email: string },
		trx = db
	): Promise<{ useless: false } | { useless: true; reason: string }> {
		assertUserIsInvitee(invite, user);

		if (invite.status !== InviteStatus.pending) {
			return {
				useless: true,
				reason: "Invite is not pending",
			};
		}

		const communityMembershipPromise = selectCommunityMember({
			userId: user.id,
			communityId: invite.communityId,
		}).executeTakeFirst();

		const isCommunityMemberUseless = (
			member: Omit<CommunityMemberships, "memberGroupId"> | undefined
		) => {
			if (!member) {
				return {
					useless: false as const,
				};
			}

			if (compareMemberRoles(member.role, "<=", invite.communityRole)) {
				return {
					useless: true as const,
					reason: "Invite would not grant additional roles",
				};
			}

			return {
				useless: false as const,
			};
		};
		if (isCommunityOnlyInvite(invite)) {
			const communityMember = await communityMembershipPromise;
			return isCommunityMemberUseless(communityMember);
		} else if (isPubInvite(invite)) {
			const [pubMember, communityMember] = await Promise.all([
				autoCache(
					trx
						.selectFrom("pub_memberships")
						.selectAll()
						.where("userId", "=", user.id)
						.where("pubId", "=", invite.pubId)
				),
				communityMembershipPromise,
			]);

			if (!pubMember) {
				return {
					useless: false,
				};
			}

			const communityMemberUseless = isCommunityMemberUseless(communityMember);

			if (
				compareMemberRoles(pubMember.role, "<=", invite.pubOrStageRole) &&
				communityMemberUseless.useless
			) {
				return {
					useless: true,
					reason: "Invite would not grant additional roles",
				};
			}

			return communityMemberUseless;
		} else if (isStageInvite(invite)) {
			const [stageMember, communityMember] = await Promise.all([
				autoCache(
					trx
						.selectFrom("stage_memberships")
						.selectAll()
						.where("userId", "=", user.id)
						.where("stageId", "=", invite.stageId)
				),
				communityMembershipPromise,
			]);

			if (!stageMember) {
				return {
					useless: false,
				};
			}

			const communityMemberUseless = isCommunityMemberUseless(communityMember);

			if (
				compareMemberRoles(stageMember.role, "<=", invite.pubOrStageRole) &&
				communityMemberUseless.useless
			) {
				return {
					useless: true,
					reason: `Invite would not grant additional roles`,
				};
			}

			return communityMemberUseless;
		}

		throw new Error("Invalid invite");
	}

	/**
	 * Adds the user to the community, and possibly the pub or stage, based on the invite data.
	 * Also grants the form permissions based on the invite data.
	 * TODO: fix these form permissions once we have reworked them
	 */
	export async function grantInviteMemberships(
		invite: Invite,
		user: { id: UsersId; email: string },
		trx = db
	) {
		assertUserIsInvitee(invite, user);

		const res = await maybeWithTrx(trx, async (trx) => {
			// TODO: override lower level of permissions if the user has already accepted another invite
			if (isCommunityOnlyInvite(invite)) {
				await insertCommunityMember({
					communityId: invite.communityId,
					userId: user.id,
					role: invite.communityRole,
				}).executeTakeFirstOrThrow();
			} else if (isPubInvite(invite)) {
				await insertCommunityMember({
					communityId: invite.communityId,
					userId: user.id,
					role: invite.communityRole,
				}).executeTakeFirstOrThrow();
				await insertPubMember({
					pubId: invite.pubId,
					userId: user.id,
					role: invite.pubOrStageRole,
				}).executeTakeFirstOrThrow();
			} else if (isStageInvite(invite)) {
				await insertCommunityMember({
					communityId: invite.communityId,
					userId: user.id,
					role: invite.communityRole,
				}).executeTakeFirstOrThrow();
				await insertStageMember({
					stageId: invite.stageId,
					userId: user.id,
					role: invite.pubOrStageRole,
				}).executeTakeFirstOrThrow();
			}
		});
	}

	export async function createSignupLink(invite: Invite) {
		const communitySlug = await getCommunitySlug();

		return `${env.PUBPUB_URL}/c/${communitySlug}/public/signup?invite=${invite.token}`;
	}

	/**
	 * Provide the path after `/c/${communitySlug}/` (no leading slash)
	 * You'll get a link like `https://pubpub.com/c/community-slug/path?invite=...`
	 */
	export async function createCommunityInviteLink(
		invite: Invite,
		path: string,
		communitySlug?: string
	) {
		const slug = communitySlug ?? (await getCommunitySlug());
		const pathWithoutLeadingSlash = path.startsWith("/") ? path.slice(1) : path;
		const url = new URL(pathWithoutLeadingSlash, `${env.PUBPUB_URL}/c/${slug}/`);
		url.searchParams.set("invite", invite.token);
		return url.toString();
	}
}

// helpers, don't need to be part of the service
function isCommunityOnlyInvite(invite: Invite): invite is Invite & { pubId: null; stageId: null } {
	return invite.pubId === null && invite.stageId === null;
}

function isPubInvite(invite: Invite): invite is Invite & { pubId: PubsId } {
	return invite.pubId !== null;
}

function isStageInvite(invite: Invite): invite is Invite & { stageId: StagesId } {
	return invite.stageId !== null;
}
