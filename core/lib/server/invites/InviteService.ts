import crypto from "node:crypto";

import type { ExpressionBuilder } from "kysely";
import type { User } from "lucia";

import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	CommunitiesId,
	CommunityMemberships,
	FormsId,
	InvitesId,
	MemberRole,
	MembershipType,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { Invite, LastModifiedBy, NewInvite, NewInviteInput } from "db/types";
import { InviteFormType, InviteStatus } from "db/public";
import { compareMemberRoles, DEFAULT_INVITE_EXPIRATION_TIME } from "db/types";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { env } from "~/lib/env/env";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { maybeWithTrx } from "..";
import { getLoginData } from "../../authentication/loginData";
import { autoCache } from "../cache/autoCache";
import { autoRevalidate } from "../cache/autoRevalidate";
import { getCommunitySlug } from "../cache/getCommunitySlug";
import {
	coalesceMemberships,
	insertCommunityMembershipsOverrideRole,
	insertPubMembershipsOverrideRole,
	insertStageMembershipsOverrideRole,
	selectCommunityMemberships,
	selectPubMemberships,
	selectStageMemberships,
} from "../member";
import { withInvitedFormIds } from "./helpers";
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
		INVITE_USELESS: "Invite is useless, as it would not grant the user any new permissions",
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

		if (invite.userId && invite.userId !== user.id) {
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
	export async function _getInvite(token: string, id: InvitesId, trx = db) {
		return trx
			.selectFrom("invites")
			.where("token", "=", token)
			.where("id", "=", id)
			.selectAll()
			.select((eb) => withInvitedFormIds(eb, "invites.id"))
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("communities")
						.select(["id", "slug", "avatar", "name"])
						.whereRef("communities.id", "=", "invites.communityId")
				)
					.$notNull()
					.as("community"),
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

	/**
	 * @internal
	 * Do not use directly
	 */
	export async function _createInvite(data: NewInvite, trx = db) {
		const {
			communityLevelFormIds,
			pubOrStageFormIds,
			communityLevelFormSlugs,
			pubOrStageFormSlugs,
			...restData
		} = data;
		const communityFormSlugsOrIds = [
			...(communityLevelFormSlugs ?? []),
			...(communityLevelFormIds ?? []),
		];
		const pubOrStageFormSlugsOrIds = [
			...(pubOrStageFormSlugs ?? []),
			...(pubOrStageFormIds ?? []),
		];

		const type =
			pubOrStageFormSlugsOrIds.length > 0
				? InviteFormType.pubOrStage
				: communityFormSlugsOrIds.length > 0
					? InviteFormType.communityLevel
					: null;

		const pubsOrStageFormIdentifiersAreSlugs = Boolean(pubOrStageFormSlugs?.length);
		const communityFormIdentifiersAreSlugs = Boolean(communityLevelFormSlugs?.length);

		const inviteBase = trx.with("invite", (db) =>
			db.insertInto("invites").values(restData).returningAll()
		);

		const withFormSlugOrId = <EB extends ExpressionBuilder<any, any>>(
			eb: EB,
			identifier: string,
			isSlug: boolean
		) => {
			if (!isSlug) {
				return identifier as FormsId;
			}

			return eb
				.selectFrom("forms")
				.select("id")
				.where("slug", "=", identifier)
				.where("communityId", "=", data.communityId)
				.limit(1);
		};

		const inviteWithForms = type
			? inviteBase.with("invite_forms", (db) =>
					db
						.insertInto("invite_forms")
						.values((eb) => [
							...(pubOrStageFormSlugsOrIds?.map((form) => ({
								inviteId: eb
									.selectFrom("invite")
									.select("id")
									.where("token", "=", data.token)
									.limit(1),
								formId: withFormSlugOrId(
									eb,
									form,
									pubsOrStageFormIdentifiersAreSlugs
								),
								type: InviteFormType.pubOrStage,
							})) ?? []),
							...(communityFormSlugsOrIds?.map((formId) => ({
								inviteId: eb
									.selectFrom("invite")
									.select("id")
									.where("token", "=", data.token)
									.limit(1),
								formId: withFormSlugOrId(
									eb,
									formId,
									communityFormIdentifiersAreSlugs
								),
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
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("communities")
						.select([
							"communities.id",
							"communities.slug",
							"communities.avatar",
							"communities.name",
						])
						.whereRef("communities.id", "=", "invite.communityId")
				)
					.$notNull()
					.as("community"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.select((eb) => [
							"pubs.id",
							"pubs.title",
							jsonObjectFrom(
								eb
									.selectFrom("pub_types")
									.select(["pub_types.id", "pub_types.name"])
									.whereRef("pub_types.id", "=", "pubs.pubTypeId")
							)
								.$notNull()
								.as("pubType"),
						])
						.whereRef("pubs.id", "=", "invite.pubId")
				).as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.select(["stages.id", "stages.name"])
						.whereRef("stages.id", "=", "invite.stageId")
				).as("stage"),
			])
			.select((eb) => withInvitedFormIds(eb, "invite.id"));

		const result = await autoRevalidate(inviteFinal).executeTakeFirstOrThrow();

		return result as Invite;
	}

	export async function setInviteSent(invite: Invite, lastModifiedBy: LastModifiedBy, trx = db) {
		await autoRevalidate(
			trx
				.updateTable("invites")
				.set({
					status: InviteStatus.pending,
					lastModifiedBy,
					lastSentAt: new Date(),
				})
				.where("id", "=", invite.id)
		).execute();
	}

	/**
	 * Sets the status of an invite to accepted
	 * Will check whether the user is allowed to accept the invite: will prevent accepting an invite for another user
	 *
	 * Therefore this should never be called as a consequence of a user other than the invitee invoking a server action
	 *
	 * @param _user {User?} Can technically also be used to accept an invite on behalf of a user who is just now created. This should be a rarer usecase, only really useful inside of a transaction, hence why it's the last option
	 *
	 * @throws {InviteError} If user is not logged in, or if user is not the invitee
	 */
	export async function acceptInvite(
		invite: Invite,
		trx = db,
		_user?: { id: UsersId; email: string }
	) {
		const result = await maybeWithTrx(trx, async (trx) => {
			const { user } = _user ? { user: _user } : await getLoginData();

			if (!user) {
				throw new InviteError("USER_NOT_LOGGED_IN");
			}

			assertUserIsInvitee(invite, user);

			await autoRevalidate(
				trx
					.updateTable("invites")
					.set({
						status: InviteStatus.accepted,
						lastModifiedBy: createLastModifiedBy({ userId: user.id }),
					})
					.where("id", "=", invite.id)
					.where("userId", "=", user.id)
			).execute();

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
		const communityMember = await selectCommunityMemberships({
			userId,
			communityId,
		}).executeTakeFirst();

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

		const communityMemberships = await selectCommunityMemberships(
			{
				userId: user.id,
				communityId: invite.communityId,
			},
			trx
		).execute();

		if (!communityMemberships?.length) {
			return {
				useless: false,
			};
		}

		const communityMembership = coalesceMemberships(communityMemberships);

		const isCommunityMemberUseless = isInviteUselessForMembership(
			{
				role: invite.communityRole,
				forms: invite.communityLevelFormIds ?? [],
			},
			communityMembership
		);
		if (isCommunityOnlyInvite(invite)) {
			return isCommunityMemberUseless;
		} else if (isPubInvite(invite)) {
			const pubMemberships = await selectPubMemberships(
				{
					userId: user.id,
					pubId: invite.pubId,
				},
				trx
			).execute();

			if (!pubMemberships?.length) {
				return {
					useless: false,
				};
			}
			const pubMember = coalesceMemberships(pubMemberships);

			const isPubMemberUseless = isInviteUselessForMembership(
				{
					role: invite.pubOrStageRole,
					forms: invite.pubOrStageFormIds ?? [],
				},
				pubMember
			);

			return isPubMemberUseless;
		} else if (isStageInvite(invite)) {
			const stageMemberships = await selectStageMemberships(
				{
					userId: user.id,
					stageId: invite.stageId,
				},
				trx
			).execute();

			if (!stageMemberships?.length) {
				return {
					useless: false,
				};
			}
			const stageMember = coalesceMemberships(stageMemberships);

			const stageMemberUseless = isInviteUselessForMembership(
				{
					role: invite.pubOrStageRole,
					forms: invite.pubOrStageFormIds ?? [],
				},
				stageMember
			);

			return stageMemberUseless;
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
			const isInviteUseless = await isInviteUselessForUser(invite, user, trx);
			if (isInviteUseless.useless) {
				logger.debug({
					msg: "For some reason, useless invite was accepted",
					invite,
					user,
					isInviteUseless,
				});
				return;
			}

			// TODO: override lower level of permissions if the user has already accepted another invite
			if (isCommunityOnlyInvite(invite)) {
				await insertCommunityMembershipsOverrideRole(
					{
						communityId: invite.communityId,
						userId: user.id,
						role: invite.communityRole,
						forms: invite.communityLevelFormIds ?? [],
					},
					trx
				).executeTakeFirstOrThrow();
			} else if (isPubInvite(invite)) {
				const communityMember = await insertCommunityMembershipsOverrideRole(
					{
						communityId: invite.communityId,
						userId: user.id,
						role: invite.communityRole,
						forms: invite.communityLevelFormIds ?? [],
					},
					trx
				).executeTakeFirstOrThrow();
				const pubMember = await insertPubMembershipsOverrideRole(
					{
						pubId: invite.pubId,
						userId: user.id,
						role: invite.pubOrStageRole,
						forms: invite.pubOrStageFormIds ?? [],
					},
					trx
				).executeTakeFirstOrThrow();
			} else if (isStageInvite(invite)) {
				await insertCommunityMembershipsOverrideRole(
					{
						communityId: invite.communityId,
						userId: user.id,
						role: invite.communityRole,
						forms: invite.communityLevelFormIds ?? [],
					},
					trx
				).executeTakeFirstOrThrow();
				await insertStageMembershipsOverrideRole(
					{
						stageId: invite.stageId,
						userId: user.id,
						role: invite.pubOrStageRole,
						forms: invite.pubOrStageFormIds ?? [],
					},
					trx
				).executeTakeFirstOrThrow();
			}

			// TODO: change this as soon as Kalil has implemented the form permissions
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

		const dbInvite = await _getInvite(token, id, trx);

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

/**
 * does the invite grant any new roles or forms
 */
function isInviteUselessForMembership(
	invite: {
		role: MemberRole;
		forms: FormsId[];
	},
	existingMembership: { role: MemberRole; forms: FormsId[] } | undefined
) {
	if (!existingMembership) {
		return {
			useless: false as const,
		};
	}

	const isLowerOrSameRole = compareMemberRoles(existingMembership.role, "<=", invite.role);

	const inviteHasNoNewForms = invite.forms.some(
		(formId) => !existingMembership.forms.includes(formId)
	);

	if (isLowerOrSameRole && inviteHasNoNewForms) {
		return {
			useless: true as const,
			reason: "Invite would not grant additional roles",
		};
	}

	return {
		useless: false as const,
	};
}
