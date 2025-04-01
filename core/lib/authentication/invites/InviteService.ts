import type { CommunitiesId, InvitesId, UsersId } from "db/public";
import type { LastModifiedBy } from "db/types";
import { InviteStatus } from "db/public";

import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getLoginData } from "../loginData";
import { InviteBuilderBase } from "./InviteBuilder";

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
	//==============================================

	/**
	 * Invite a non-user by email. If the email is already assigned to a user, that specific user will be invited instead.
	 */
	export function inviteEmail(email: string) {
		return InviteBuilderBase.create().forEmail(email);
	}

	/**
	 * Invite a specific user
	 */
	export function inviteUser(userId: UsersId) {
		return InviteBuilderBase.create().forUser(userId);
	}

	// The rest of the service methods for managing invites
	export async function getInviteByToken(token: string, communityId: CommunitiesId, trx = db) {
		return trx
			.selectFrom("invites")
			.where("token", "=", token)
			.where("communityId", "=", communityId)
			.selectAll()
			.executeTakeFirst();
	}

	/**
	 * Sets the status of an invite to accepted
	 * Will check whether the user is allowed to accept the invite: will prevent accepting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteNotFoundError}
	 * @throws {InviteNotPendingError}
	 * @throws {InviteNotForUserError}
	 */
	export async function acceptInvite(
		token: string,
		communityId: CommunitiesId,
		lastModifiedBy: LastModifiedBy,
		trx = db
	) {
		const invite = await getValidInvite(token, communityId, trx);

		await autoRevalidate(
			trx
				.updateTable("invites")
				.set({ status: InviteStatus.accepted, lastModifiedBy })
				.where("id", "=", invite.id)
		).execute();
	}

	/**
	 * Sets the status of an invite to reject
	 * Will check whether the user is allowed to reject the invite: will prevent rejecting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @throws {InviteNotFoundError}
	 * @throws {InviteNotPendingError}
	 * @throws {InviteNotForUserError}
	 */
	export async function rejectInvite(
		token: string,
		communityId: CommunitiesId,
		lastModifiedBy: LastModifiedBy,
		trx = db
	) {
		const invite = await getValidInvite(token, communityId, trx);

		await autoRevalidate(
			trx
				.updateTable("invites")
				.set({ status: InviteStatus.rejected, lastModifiedBy })
				.where("id", "=", invite.id)
		).execute();
	}

	/**
	 * Revokes an invite for another user
	 *
	 * Only the person who created the invite
	 */
	export async function revokeInvite(
		token: string,
		communityId: CommunitiesId,
		lastModifiedBy: LastModifiedBy,
		trx = db
	) {
		const invite = await getValidInvite(token, communityId, trx);

		await autoRevalidate(
			trx
				.updateTable("invites")
				.set({ status: InviteStatus.revoked, lastModifiedBy })
				.where("id", "=", invite.id)
		);
	}

	/**
	 * @throws {InviteNotFoundError}
	 * @throws {InviteNotPendingError}
	 * @throws {InviteNotForUserError}
	 */
	async function getValidInvite(token: string, communityId: CommunitiesId, trx = db) {
		const [invite, { user }] = await Promise.all([
			getInviteByToken(token, communityId, trx),
			getLoginData(),
		]);

		if (!invite) {
			throw new InviteNotFoundError(token, communityId);
		}

		if (!!user && (invite.userId !== user?.id || invite.email !== user?.email)) {
			throw new InviteNotForUserError(token, communityId, user.id);
		}

		if (invite.status !== InviteStatus.pending) {
			throw new InviteNotPendingError(token, communityId, invite.status);
		}

		return invite;
	}
}
