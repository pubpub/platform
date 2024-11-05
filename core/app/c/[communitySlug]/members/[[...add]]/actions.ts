"use server";

import { cache } from "react";

import type { MembersId, UsersId } from "db/public";
import { MemberRole } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import type { UserWithMember } from "~/lib/types";
import { db } from "~/kysely/database";
import { getLoginData } from "~/lib/auth/loginData";
import { isCommunityAdmin as isAdminOfCommunity } from "~/lib/auth/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import * as Email from "~/lib/server/email";
import {
	inviteMember as dbAddMember,
	getMember as dbGetMember,
	removeMember as dbRemoveMember,
} from "~/lib/server/member";
import { addUser } from "~/lib/server/user";
import { generateHash, slugifyString } from "~/lib/string";
import { memberInviteFormSchema } from "./memberInviteFormSchema";

const isCommunityAdmin = cache(async () => {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);

	if (!user) {
		return {
			error: "You are not logged in",
		};
	}

	if (!community) {
		return {
			error: "Community not found",
		};
	}

	if (!isAdminOfCommunity(user, community)) {
		return {
			error: "You do not have permission to invite members to this community",
		};
	}

	return { user, error: null, community };
});

/**
 * Adds a member to a community.
 *
 * First checks if the user is already a member of the community. If not, creates a new member in
 * the db and revalidates the member list.
 *
 * @param user - The user to add as a member.
 * @param role - Optional. Specifies the role of the user in the community.
 * @param community - The community to add the member to.
 * @returns A Promise that resolves to the newly created member object, or an error object if an
 *   error occurs.
 */
export const addMember = defineServerAction(async function addMember({
	user,
	role,
}: {
	user: UserWithMember;
	role?: MemberRole;
}) {
	const result = await isCommunityAdmin();
	if (result.error !== null) {
		return {
			title: "Failed to add member",
			error: "You do not have permission to invite members to this community",
		};
	}

	try {
		const existingMember = await dbGetMember({
			userId: user.id as UsersId,
			communityId: result.community.id,
		}).executeTakeFirst();

		if (existingMember) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this community",
			};
		}

		const member = await dbAddMember({
			userId: user.id as UsersId,
			communityId: result.community.id,
			role: role ?? MemberRole.editor,
		}).executeTakeFirst();

		// TODO: send email to user confirming their membership,
		// don't just add them

		return { member };
	} catch (error) {
		return {
			title: "Failed to add member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

/**
 * Create a new user and add them as a member to a community
 */
export const createUserWithMembership = defineServerAction(async function createUserWithMembership({
	...data
}: {
	firstName: string;
	lastName?: string | null;
	email: string;
	/**
	 * @default MemberRole.editor
	 */
	role?: MemberRole;
	isSuperAdmin?: boolean;
}) {
	const parsed = memberInviteFormSchema
		.required({ firstName: true, lastName: true })
		.safeParse(data);

	if (!parsed.success) {
		return {
			title: "Form values are invalid",
			error: parsed.error.message,
		};
	}

	const { firstName, lastName, email, role: maybeRole, isSuperAdmin } = parsed.data;

	const role = maybeRole ?? MemberRole.editor;

	try {
		const { error: adminError, user, community } = await isCommunityAdmin();
		if (!user?.isSuperAdmin && isSuperAdmin) {
			return {
				title: "Failed to add member",
				error: "You cannot add members as super admins",
			};
		}

		if (adminError !== null) {
			return {
				title: "Failed to add member",
				error: "You do not have permission to invite members to this community",
			};
		}

		const trx = db.transaction();

		const inviteUserResult = await trx.execute(async (trx) => {
			const newUser = await addUser(
				{
					email,
					firstName,
					lastName,
					slug: `${slugifyString(firstName)}${
						lastName ? `-${slugifyString(lastName)}` : ""
					}-${generateHash(4, "0123456789")}`,
					isSuperAdmin: isSuperAdmin === true,
				},
				trx
			).executeTakeFirstOrThrow();

			const member = await dbAddMember(
				{
					userId: newUser.id,
					communityId: community.id,
					role: role,
				},
				trx
			).executeTakeFirstOrThrow();

			const result = await Email.signupInvite(
				{
					user: newUser,
					community,
					role: member.role,
				},
				trx
			).send();

			return result;
		});

		return inviteUserResult;
	} catch (error) {
		return {
			title: "Failed to add member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const removeMember = defineServerAction(async function removeMember({
	member,
}: {
	member: TableMember;
}) {
	try {
		const { user, error: adminError, community } = await isCommunityAdmin();

		if (adminError !== null) {
			return {
				title: "Failed to remove member",
				error: adminError,
			};
		}

		if (user?.memberships.find((m) => m.id === member.id)) {
			return {
				title: "Failed to remove member",
				error: "You cannot remove yourself from the community",
			};
		}

		const removedMember = await dbRemoveMember(member.id as MembersId).executeTakeFirst();

		if (!removedMember) {
			return {
				title: "Failed to remove member",
				error: "An unexpected error occurred",
			};
		}

		return { success: true };
	} catch (error) {
		return {
			title: "Failed to remove member",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
