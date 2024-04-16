"use server";

import { revalidatePath } from "next/cache";

import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";
import prisma from "~/prisma/db";
import { TableCommunity } from "./getCommunityTableColumns";

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
	if (!user.isSuperAdmin) {
		return {
			title: "Failed to create community",
			error: "User is not a super admin",
		};
	}
	try {
		// const communityExists = await db
		// 	.selectFrom("communities")
		// 	.where("slug", "=", slug)
		// 	.execute();

		const communityExists = await prisma.community.findFirst({
			where: {
				slug,
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
		});

		// const c = await db
		// 	.insertInto("communities")
		// 	.values({
		// 		name,
		// 		slug: slugifyString(slug),
		// 		avatar
		// 	})
		// 	.returning(["id", "name", "slug", "avatar", "created_at"])
		// 	.executeTakeFirst();

		// add the user as a member of the community
		await prisma.member.create({
			data: {
				userId: user.id,
				communityId: c.id,
				canAdmin: true,
			},
		});

		// await db
		// 	.insertInto("members")
		// 	.values({
		// 		user_id: user.id,
		// 		community_id: c.id as CommunitiesId,
		// 		canAdmin: true,
		// 	})
		// 	.executeTakeFirst();

		revalidatePath("/");
		return c;
	} catch (error) {
		return {
			title: "Failed to create community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const removeCommunity = defineServerAction(async function removeCommunity({
	user,
	community,
}: {
	user: any;
	community: TableCommunity;
}) {
	if (!user.isSuperAdmin) {
		return {
			title: "Failed to remove community",
			error: "User is not a super admin",
		};
	}
	try {
		// await db
		// 	.deleteFrom("communities")
		// 	.where("id", "=", community.id as CommunitiesId)
		// 	.execute();

		await prisma.community.delete({
			where: {
				id: community.id,
			},
		});
		revalidatePath("/");
		return;
	} catch (error) {
		return {
			title: "Failed to remove community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});
