"use server";

import { cache } from "react";

import type { UsersId } from "db/public";
import { MemberRole } from "db/public";
import { MembershipType } from "db/src/public/MembershipType";

import type { TableMember } from "./getMemberTableColumns";
import { memberInviteFormSchema } from "~/app/components/Memberships/memberInviteFormSchema";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin as isAdminOfCommunity } from "~/lib/authentication/roles";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { deleteCommunityMember, insertCommunityMember } from "~/lib/server/member";
import { createUserWithMembership } from "~/lib/server/user";

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
	userId,
	role,
}: {
	userId: UsersId;
	role: MemberRole;
}) {
	const result = await isCommunityAdmin();
	if (result.error !== null) {
		return {
			title: "Failed to add member",
			error: "You do not have permission to invite members to this community",
		};
	}

	try {
		const member = await insertCommunityMember({
			userId,
			communityId: result.community.id,
			role,
		}).executeTakeFirst();

		// TODO: send email to user confirming their membership,
		// don't just add them

		return { member };
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				title: "Failed to add member",
				error: "User is already a member of this community",
			};
		}
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
export const createUserWithCommunityMembership = defineServerAction(
	async function createUserWithCommunityMembership({
		...data
	}: {
		firstName: string;
		lastName?: string | null;
		email: string;
		role: MemberRole;
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

		try {
			return await createUserWithMembership({
				...parsed.data,
				membership: { type: MembershipType.community, role: data.role },
			});
		} catch (error) {
			return {
				title: "Failed to add member",
				error: "An unexpected error occurred",
				cause: error,
			};
		}
	}
);

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

		const removedMember = await deleteCommunityMember(member.id).executeTakeFirst();

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
