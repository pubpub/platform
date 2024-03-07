"use server";

import type { SuggestedUser } from "~/lib/server/members";

import { getSuggestedMembers } from "~/lib/server";
import prisma from "~/prisma/db";
import { Community, Member, User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getLoginData } from "~/lib/auth/loginData";
import { getServerSupabase } from "~/lib/supabaseServer";
import { formatSupabaseError } from "~/lib/supabase";

export const suggest = cache(
	async ({ email, community }: { email: string; community: Community }) => {
		try {
			const loginData = await getLoginData();

			const currentCommunityMembership = loginData?.memberships?.find(
				(m) => m.communityId === community.id
			);
			const isAdmin = currentCommunityMembership?.canAdmin;

			if (!isAdmin) {
				return {
					user: null,
					error: "You do not have permission to add members to this community",
				};
			}

			if (email === loginData?.email) {
				return {
					user: "you" as const,
					error: "You cannot add yourself as a member",
				};
			}

			const [user] = await getSuggestedMembers(email);

			if (!user) {
				return { user: null };
			}

			const existingMember = await prisma.member.findFirst({
				where: {
					userId: user.id,
					communityId: community.id,
				},
			});

			if (existingMember) {
				return {
					user: "existing-member" as const,
					error: "User is already a member of this community",
				};
			}

			return { user };
		} catch (error) {
			return {
				user: null,
				error: error.message,
			};
		}
	}
);

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

		revalidatePath(`/c/${community.slug}/members`, "page");
		return member;
	} catch (error) {
		return { error: error.message };
	}
};

export const removeMember = async ({
	member,
	path,
}: {
	member: Member & { user: User };
	path: string | null;
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

		if (path) {
			revalidatePath(path, "page");
		}
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

	revalidatePath(`/c/${community.slug}/members`, "page");
	return {
		user: resendData.user,
		error: null,
	};
};
