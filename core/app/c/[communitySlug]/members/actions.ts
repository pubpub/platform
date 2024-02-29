"use server";

import type { SuggestedUser } from "~/lib/server/members";

import { getSuggestedMembers } from "~/lib/server";
import prisma from "~/prisma/db";
import { Community } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const suggest = async (email?: string) => {
	try {
		const users = await getSuggestedMembers(email);
		return users;
	} catch (error) {
		return { error: error.message };
	}
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

		revalidatePath(`/c/${community.slug}/members`, "page");
		return member;
	} catch (error) {
		return { error: error.message };
	}
};
