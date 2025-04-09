import crypto from "node:crypto";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	CommunityMemberships,
	InvitesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { Invite, LastModifiedBy } from "db/types";
import { InviteStatus } from "db/public";
import { compareMemberRoles } from "db/types";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env.mjs";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
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

	export const INVITE_ERRORS = {
		NOT_FOUND: "Invite not found",
		NOT_PENDING: "Invite not pending",
		NOT_FOR_USER: "Invite not for user",
		INVALID_TOKEN: "Invalid invite token",
		ALREADY_ACCEPTED: "Invite already accepted",
		ALREADY_REJECTED: "Invite already rejected",
		REVOKED: "Invite revoked",
		EXPIRED: "Invite expired",
		USER_NOT_LOGGED_IN: "User not logged in",
	} as const;

	export type InviteErrorType = keyof typeof INVITE_ERRORS;

	export class InviteError extends Error {
		code: InviteErrorType;
		status?: InviteStatus;
		constructor(
			code: InviteErrorType,
			opts?: {
				status?: InviteStatus;
				additionalMessage?: string;
				logContext?: Record<string, unknown>;
			}
		) {
			const msg = `${code}: ${INVITE_ERRORS[code]}.${opts?.additionalMessage ?? ""}`;
			if (opts?.logContext) {
				// these are expected errors, so we don't want to log them as errors
				logger.debug({
					msg,
					...opts.logContext,
				});
			}
			super(msg);
			this.code = code;
			this.status = opts?.status;
		}
	}

	export const assertUserIsInvitee = (
		invite: Invite,
		user: { id: UsersId; email: string } | null
	) => {
		if (!user) {
			return;
		}

		if (invite.email && user.email !== invite.email) {
			throw new InviteError("NOT_FOR_USER", {
				logContext: {
					inviteToken: invite.token,
					userId: user.id,
				},
				status: invite.status,
			});
		}

		if (invite.userId !== user.id) {
			throw new InviteError("NOT_FOR_USER", {
				logContext: {
					inviteToken: invite.token,
					userId: user.id,
				},
				status: invite.status,
			});
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

	/**
	 * @internal
	 */
	async function getInvite(token: string, id: InvitesId, trx = db) {
		return trx
			.selectFrom("invites")
			.where("token", "=", token)
			.where("id", "=", id)
			.selectAll()
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("communities")
						.select(["id", "slug", "avatar", "name"])
						.whereRef("communities.id", "=", "invites.communityId")
				).as("community"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.select((eb) => [
							"id",
							"title",
							jsonObjectFrom(
								eb
									.selectFrom("pub_types")
									.select(["id", "name"])
									.whereRef("pub_types.id", "=", "pubs.pubTypeId")
							)
								.$notNull()
								.as("pubType"),
						])
						.whereRef("pubs.id", "=", "invites.pubId")
				).as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.select(["id", "name"])
						.whereRef("stages.id", "=", "invites.stageId")
				).as("stage"),
			])
			.executeTakeFirst() as Promise<Invite | null>;
	}

	export async function setInviteSent(invite: Invite, lastModifiedBy: LastModifiedBy, trx = db) {
		await trx
			.updateTable("invites")
			.set({
				status: InviteStatus.pending,
				lastModifiedBy,
				lastSentAt: new Date(),
			})
			.where("id", "=", invite.id)
			.execute();
	}

	/**
	 * Sets the status of an invite to accepted
	 * Will check whether the user is allowed to accept the invite: will prevent accepting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteError} If user is not logged in, or if user is not the invitee
	 */
	export async function acceptInvite(invite: Invite, trx = db) {
		const result = await maybeWithTrx(trx, async (trx) => {
			const { user } = await getLoginData();

			if (!user) {
				throw new InviteError("USER_NOT_LOGGED_IN");
			}

			assertUserIsInvitee(invite, user);

			await trx
				.updateTable("invites")
				.set({
					status: InviteStatus.accepted,
					lastModifiedBy: createLastModifiedBy({ userId: user.id }),
				})
				.where("id", "=", invite.id)
				.where("userId", "=", user.id)
				.execute();

			await grantInviteMemberships(invite, user, trx);
		});

		return result;
	}

	/**
	 * Sets the status of an invite to reject
	 * Will check whether the user is allowed to reject the invite: will prevent rejecting an invite for another user
	 * Although technically anyone can reject an invite if they have it
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteError}
	 */
	export async function rejectInvite(invite: Invite, trx = db) {
		const { user } = await getLoginData();

		if (user) {
			assertUserIsInvitee(invite, user);
		}

		await trx
			.updateTable("invites")
			.set({
				status: InviteStatus.rejected,
				// system here means that the user with the email rejected the invite
				// but they did not sign up yet (ofc)
				lastModifiedBy: createLastModifiedBy(user ? { userId: user.id } : "system"),
			})
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
	 * @throws {InviteError}
	 */
	export async function getValidInviteForLoggedInUser(inviteToken: string, trx = db) {
		const [invite, { user }] = await Promise.all([
			getValidInvite(inviteToken, trx),
			getLoginData(),
		]);

		assertUserIsInvitee(invite, user);

		return {
			invite,
			user,
		};
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
	 * TODO: add form permissions once we have reworked them
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

	/**
	 * Creates a link to an invite page with an invite token
	 */
	export async function createInviteLink(
		invite: Invite,
		options: {
			redirectTo: string;
			/**
			 * If true, the url will be absolute
			 * @default true
			 */
			absolute?: boolean;
		}
	) {
		const communitySlug = await getCommunitySlug();
		const inviteToken = createInviteToken(invite);

		const searchParams = new URLSearchParams();
		searchParams.set("invite", inviteToken);
		searchParams.set("redirectTo", options.redirectTo);

		return `${options?.absolute === false ? "" : env.PUBPUB_URL}/c/${communitySlug}/public/invite?${searchParams.toString()}`;
	}

	export function createInviteToken(invite: Invite) {
		return `${invite.id}.${invite.token}`;
	}

	export function parseInviteToken(inviteToken: string) {
		const [id, token] = inviteToken.split(".");
		return { id: id as InvitesId, token };
	}

	/**
	 * Get an invite, and throw an error if it is not valid
	 * @throws {InviteError}
	 */
	export async function getValidInvite(inviteToken: string, trx = db) {
		const { id, token } = parseInviteToken(inviteToken);

		const dbInvite = await getInvite(token, id, trx);

		if (!dbInvite) {
			throw new InviteError("NOT_FOUND", {
				logContext: {
					inviteToken,
				},
				status: InviteStatus.created,
			});
		}

		if (dbInvite.status !== InviteStatus.pending) {
			throw new InviteError("NOT_PENDING", {
				logContext: {
					inviteToken,
					invite: dbInvite,
				},
				status: dbInvite.status,
			});
		}

		if (
			!crypto.timingSafeEqual(
				new Uint8Array(Buffer.from(dbInvite.token)),
				new Uint8Array(Buffer.from(token))
			)
		) {
			throw new InviteError("INVALID_TOKEN", {
				logContext: {
					inviteToken,
					invite: dbInvite,
				},
				status: dbInvite.status,
			});
		}

		if (dbInvite.expiresAt < new Date()) {
			throw new InviteError("EXPIRED", {
				logContext: {
					inviteToken,
					invite: dbInvite,
				},
				status: dbInvite.status,
			});
		}

		return dbInvite;
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
