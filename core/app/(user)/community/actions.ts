"use server";

import { revalidatePath } from "next/cache";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";
import prisma from "~/prisma/db";

export const createCommunity = defineServerAction(async function createCommunity({
	user,
	name,
	slug,
	avatar,
}: {
	name: string;
	slug: string;
	avatar?: string;
	user: any;
}) {
	try {
		if (user.isSuperAdmin) {
			const communityExists = await prisma.community.findFirst({
				where: {
					slug: {
						equals: slug,
					},
				},
			});

			if (communityExists) {
				return {
					title: "Failed to create community",
					error: "Community already exists",
				};
			}

			const c = await prisma.community.create({
				data: {
					name, // not sure what to enfore for community name
					slug: slugifyString(slug),
					avatar, // should make sure this is a path
				},
			}); // revalidate cache tags so update happens eventually

			// add the user as a member of the community
			await prisma.member.create({
				data: {
					userId: user.id,
					communityId: c.id,
					canAdmin: true,
				},
			});
			revalidatePath("/");
			return c;
		}
		return false;
	} catch (error) {
		return {
			title: "Failed to create community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const removeCommunity = defineServerAction(async function removeCommunity({
	id,
}: {
	id: string;
}) {
	try {
		await prisma.community.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		return {
			title: "Failed to remove community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
