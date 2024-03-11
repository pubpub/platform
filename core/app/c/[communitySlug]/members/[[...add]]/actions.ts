"use server";

import type { SuggestedUser } from "~/lib/server/members";

import prisma from "~/prisma/db";
import { Community, Member, User } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { getLoginData } from "~/lib/auth/loginData";
import { getServerSupabase } from "~/lib/supabaseServer";
import { formatSupabaseError } from "~/lib/supabase";

export const revalidateMemberPathsAndTags = (community: Community) => {
	revalidatePath(`/c/${community.slug}/members`);
	revalidateTag(`members_${community.id}`);
};

export const addMember = async ({
	user,
	admin,
	community,
}: {
	user: SuggestedUser;
	admin?: boolean;
	community: Community;
}) => {
	try {
		const existingMember = await prisma.member.findFirst({
			where: {
				userId: user.id,
				communityId: community.id,
			},
		});

		if (existingMember) {
			return { error: "User is already a member of this community" };
		}

		const member = await prisma.member.create({
			data: {
				communityId: community.id,
				userId: user.id,
				canAdmin: Boolean(admin),
			},
		});

		revalidateMemberPathsAndTags(community);

		// the user exists in our DB, but not in supabase
		// most likely they were invited as an evaluator before
		if (!user.supabaseId) {
			const { error: supabaseInviteError } = await inviteMember({
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				community,
			});

			if (supabaseInviteError) {
				return { error: supabaseInviteError };
			}
		}

		return member;
	} catch (error) {
		return { error: error.message };
	}
};

export const removeMember = async ({
	member,
	community,
}: {
	member: Member & { user: User };
	community: Community;
}) => {
	try {
		const loginData = await getLoginData();

		if (member.userId === loginData?.id) {
			return { error: "You cannot remove yourself from the community" };
		}

		const deleted = await prisma.member.delete({
			where: {
				id: member.id,
			},
		});

		if (!deleted) {
			return { error: "Failed to remove member" };
		}

		revalidateMemberPathsAndTags(community);
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};

export const inviteMember = async ({
	email,
	firstName,
	lastName,
	community,
}: {
	email: string;
	firstName: string;
	lastName?: string | null;
	community: Community;
}) => {
	const loginData = await getLoginData();

	if (!loginData?.memberships?.find((m) => m.communityId === community.id)?.canAdmin) {
		throw new Error("You do not have permission to invite members to this community");
	}

	const client = getServerSupabase();

	const { error, data } = await client.auth.admin.inviteUserByEmail(email, {
		redirectTo: `${process.env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
		data: {
			firstName,
			lastName,
			communityId: community.id,
			communitySlug: community.slug,
			communityName: community.name,
			canAdmin: true,
		},
	});

	if (!error) {
		revalidateMemberPathsAndTags(community);
		return { user: data.user, error: null };
	}

	// 422 = email already exists
	if (error.status !== 422) {
		// could be anything!
		return { user: null, error: `Failed to invite member.\n ${formatSupabaseError(error)}` };
	}

	const { data: resendData, error: resendError } = await client.auth.resend({
		email,
		type: "signup",
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
		},
	});

	if (resendError) {
		return {
			user: null,
			error: `Failed to invite member.\n ${formatSupabaseError(resendError)}`,
		};
	}

	revalidateMemberPathsAndTags(community);
	return {
		user: resendData.user,
		error: null,
	};
};
