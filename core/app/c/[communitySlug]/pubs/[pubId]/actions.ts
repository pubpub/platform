"use server";

import type { MemberRole, PubsId, UsersId } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { userCan } from "~/lib/authorization/capabilities";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { insertPubMember } from "~/lib/server/member";
import { createUserWithMembership } from "~/lib/server/user";

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
	}: {
		userId: UsersId;
		role: MemberRole;
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

		await insertPubMember({ userId, pubId, role }).execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this pub",
			};
		}
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
	}
) {
	await createUserWithMembership({
		...data,
		membership: {
			pubId,
			role: data.role,
			type: MembershipType.pub,
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
