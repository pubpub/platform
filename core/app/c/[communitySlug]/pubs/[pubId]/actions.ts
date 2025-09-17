"use server";

import type { FormsId, PubsId, UsersId } from "db/public";
import { Capabilities, MemberRole, MembershipType } from "db/public";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { ApiError } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { deletePubMemberships, insertPubMemberships } from "~/lib/server/member";
import { createUserWithMemberships } from "~/lib/server/user";

export const removePubMember = defineServerAction(async function removePubMember(
	userId: UsersId,
	pubId: PubsId
) {
	const { user } = await getLoginData();
	if (!user) {
		return {
			error: "Not logged in",
		};
	}
	if (
		!(await userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to remove a pub member",
		};
	}
	await autoRevalidate(
		db
			.deleteFrom("pub_memberships")
			.where("pub_memberships.pubId", "=", pubId)
			.where("pub_memberships.userId", "=", userId)
	).execute();
});

export const addPubMember = defineServerAction(async function addPubMember(
	pubId: PubsId,
	{
		userId,
		role,
		forms,
	}: {
		userId: UsersId;
		role: MemberRole;
		forms: FormsId[];
	}
) {
	try {
		const { user } = await getLoginData();
		if (!user) {
			return {
				error: "Not logged in",
			};
		}
		if (
			!(await userCan(
				Capabilities.addPubMember,
				{ type: MembershipType.pub, pubId },
				user.id
			))
		) {
			return {
				title: "Unauthorized",
				error: "You are not authorized to add a pub member",
			};
		}

		await insertPubMemberships({ userId, pubId, role, forms }).execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this pub",
			};
		}
	}
});

export const updatePubMember = defineServerAction(async function updatePubMember({
	userId,
	role,
	forms,
	targetId,
}: {
	userId: UsersId;
	role: MemberRole;
	forms: FormsId[];
	targetId: PubsId;
}) {
	try {
		const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

		if (!user) {
			return {
				error: ApiError.NOT_LOGGED_IN,
			};
		}

		if (!community) {
			return {
				error: ApiError.COMMUNITY_NOT_FOUND,
			};
		}

		if (
			!(await userCan(
				Capabilities.removePubMember,
				{ type: MembershipType.pub, pubId: targetId },
				user.id
			))
		) {
			return {
				title: "Unauthorized",
				error: "You are not authorized to update a stage member",
			};
		}

		const result = await db.transaction().execute(async (trx) => {
			await deletePubMemberships(
				{
					pubId: targetId,
					userId,
				},
				trx
			).execute();

			return insertPubMemberships(
				{
					pubId: targetId,
					userId,
					role,
					forms: role === MemberRole.contributor ? forms : [],
				},
				trx
			).execute();
		});

		if (!result) {
			return {
				title: "Failed to update member",
				error: "An unexpected error occurred",
			};
		}

		return { success: true };
	} catch (error) {
		return {
			title: "Failed to update member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const addUserWithPubMembership = defineServerAction(async function addUserWithPubMembership(
	pubId: PubsId,
	data: {
		firstName: string;
		lastName?: string | null;
		email: string;
		role: MemberRole;
		isSuperAdmin?: boolean;
		forms: FormsId[];
	}
) {
	await createUserWithMemberships({
		...data,
		membership: {
			pubId,
			role: data.role,
			type: MembershipType.pub,
			forms: data.forms,
		},
	});
});

export const setPubMemberRole = defineServerAction(async function setPubMemberRole(
	pubId: PubsId,
	role: MemberRole,
	userId: UsersId
) {
	const { user } = await getLoginData();
	if (!user) {
		return {
			error: "Not logged in",
		};
	}
	if (
		!(await userCan(Capabilities.removePubMember, { type: MembershipType.pub, pubId }, user.id))
	) {
		return {
			title: "Unauthorized",
			error: "You are not authorized to set a pub member's role",
		};
	}
	await autoRevalidate(
		db
			.updateTable("pub_memberships")
			.where("pubId", "=", pubId)
			.where("userId", "=", userId)
			.set({ role })
	).execute();
});
