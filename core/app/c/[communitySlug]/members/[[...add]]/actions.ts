"use server";

import type { SuggestedUser } from "~/lib/server/members";

import { getSuggestedMembers } from "~/lib/server";
import prisma from "~/prisma/db";
import { Community, Member, User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getLoginData } from "~/lib/auth/loginData";
import { smtpclient } from "~/lib/server/mailgun";
import { getServerSupabase } from "~/lib/supabaseServer";
import { randomUUID } from "crypto";
import { formatSupabaseError } from "~/lib/supabase";

export const suggest = cache(async (email: string, community: Community) => {
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
			member: null,
			error: error.message,
		};
	}
});

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
	lastName: string;
	community: Community;
}) => {
	const loginData = await getLoginData();

	if (!loginData?.memberships?.find((m) => m.communityId === community.id)?.canAdmin) {
		throw new Error("You do not have permission to invite members to this community");
	}

	const client = getServerSupabase();

	const { error } = await client.auth.signUp({
		email,
		password: randomUUID(),
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_PUBPUB_URL}/reset`,
			data: {
				firstName,
				lastName,
				communityId: community.id,
				canAdmin: true,
			},
		},
	});
	if (error) {
		throw new Error(formatSupabaseError(error));
	}
};
