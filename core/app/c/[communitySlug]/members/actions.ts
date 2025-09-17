"use server";

import { cache } from "react";

import type { FormsId, UsersId } from "db/public";
import { MemberRole, MembershipType } from "db/public";

import type { TableMember } from "./getMemberTableColumns";
import { memberInviteFormSchema } from "~/app/components/Memberships/memberInviteFormSchema";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { isCommunityAdmin as isAdminOfCommunity } from "~/lib/authentication/roles";
import { env } from "~/lib/env/env";
import { ApiError } from "~/lib/server";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { deleteCommunityMemberships, insertCommunityMemberships } from "~/lib/server/member";
import { createUserWithMemberships } from "~/lib/server/user";

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
			error: "You do not have permission to manage members in this community",
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
	forms,
}: {
	userId: UsersId;
	role: MemberRole;
	forms: FormsId[];
}) {
	const result = await isCommunityAdmin();

	if (result.error !== null) {
		return {
			title: "Failed to add member",
			error: "You do not have permission to invite members to this community",
		};
	}

	if (env.FLAGS?.get("invites") === false) {
		return ApiError.FEATURE_DISABLED;
	}

	try {
		const member = await insertCommunityMemberships({
			userId,
			communityId: result.community.id,
			role,
			forms,
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
		forms: FormsId[];
	}) {
		if (env.FLAGS?.get("invites") === false) {
			return ApiError.FEATURE_DISABLED;
		}

		const parsed = memberInviteFormSchema
			.required({ firstName: true, lastName: true })
			.safeParse(data);

		if (!parsed.success) {
			return {
				title: "Form values are invalid",
				error: parsed.error.message,
			};
		}

		const community = await findCommunityBySlug();

		if (!community) {
			return {
				title: "Failed to add member",
				error: "Community not found",
			};
		}

		try {
			return await createUserWithMemberships({
				...parsed.data,
				membership: {
					type: MembershipType.community,
					role: data.role,
					communityId: community.id,
					forms: data.forms,
				},
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

		const removedMember = await deleteCommunityMemberships({
			userId: member.id,
			communityId: community.id,
		}).executeTakeFirst();

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

export const updateMember = defineServerAction(async function updateMember({
	userId,
	role,
	forms,
}: {
	userId: UsersId;
	role: MemberRole;
	forms: FormsId[];
}) {
	try {
		const { user, error: adminError, community } = await isCommunityAdmin();

		if (adminError !== null) {
			return {
				title: "Failed to update member",
				error: adminError,
			};
		}

		const result = await db.transaction().execute(async (trx) => {
			await deleteCommunityMemberships(
				{
					communityId: community.id,
					userId,
				},
				trx
			).execute();

			return insertCommunityMemberships(
				{
					communityId: community.id,
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
