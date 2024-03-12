"use server";

import type { SuggestedUser } from "~/lib/server/members";

import prisma from "~/prisma/db";
import { Community, Member, User } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { getLoginData } from "~/lib/auth/loginData";
import { getServerSupabase } from "~/lib/supabaseServer";
import { formatSupabaseError } from "~/lib/supabase";
import { generateHash, slugifyString } from "~/lib/string";
import { captureException } from "@sentry/nextjs";

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
	retry = false,
}: {
	email: string;
	firstName: string;
	lastName?: string | null;
	community: Community;
	retry?: boolean;
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

	// successfully invited user
	if (!error) {
		// create user and add as member
		const user = await prisma.user.create({
			data: {
				email,
				firstName,
				lastName,
				supabaseId: data.user?.id,
				slug: `${slugifyString(firstName)}${
					lastName ? `-${slugifyString(lastName)}` : ""
				}-${generateHash(4, "0123456789")}`,
				memberships: {
					create: {
						communityId: community.id,
						canAdmin: true,
					},
				},
			},
		});

		revalidateMemberPathsAndTags(community);
		return { user: data.user, error: null };
	}

	// 422 = email already exists in supabase
	if (error.status !== 422) {
		captureException(error);
		// could be anything!
		return { user: null, error: `Failed to invite member.\n ${formatSupabaseError(error)}` };
	}

	if (retry) {
		captureException("Somehow unable to reinvite user even after deleting them from supabase");
		return { user: null, error: `Failed to invite member.` };
	}

	// from here on, we know the user already exists in supabase, and that they do not exist in our DB
	// we can therefore safely delete the user from supabase and re-invite them

	const { data: supabaseUserData, error: getEmailError } = await client.auth.admin.getUserByEmail(
		email
	);

	if (getEmailError) {
		// all hope is lost
		captureException(getEmailError);
		return { user: null, error: `Failed to invite member.` };
	}

	const { error: deleteError } = await client.auth.admin.deleteUser(supabaseUserData.user.id);

	if (deleteError) {
		captureException(deleteError);
		return { user: null, error: `Failed to invite member.` };
	}

	console.log("Retrying invite for user ", email);
	// we try again!
	return inviteMember({
		email,
		firstName,
		lastName,
		community,
		retry: true,
	});
};
