"use server";

import type { MemberRole, PubsId, UsersId } from "db/public";
import { MembershipType } from "db/src/public/MembershipType";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { insertPubMember } from "~/lib/server/member";
import { createUserWithMembership } from "~/lib/server/user";

export const removePubMember = defineServerAction(async function removePubMember(
	userId: UsersId,
	pubId: PubsId
) {
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
	await autoRevalidate(
		db
			.updateTable("pub_memberships")
			.where("pubId", "=", pubId)
			.where("userId", "=", userId)
			.set({ role })
	).execute();
});
