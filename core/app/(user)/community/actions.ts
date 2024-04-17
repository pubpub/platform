"use server";

import { revalidatePath } from "next/cache";

import { expect } from "utils";

import { db } from "~/kysely/database";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";
import prisma from "~/prisma/db";
import { crocCrocId } from "~/prisma/exampleCommunitySeeds/croccroc";
import { unJournalId } from "~/prisma/exampleCommunitySeeds/unjournal";
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
		// 	.where("slug", "=", `${slug}`)
		// 	.executeTakeFirst();

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

		const c = expect(
			await db
				.insertInto("communities")
				.values({
					name,
					slug: slugifyString(slug),
					avatar,
				})
				.returning(["id", "name", "slug", "avatar", "created_at as createdAt"])
				.executeTakeFirst()
		);

		await db
			.insertInto("members")
			.values({
				user_id: user.id,
				community_id: c.id as CommunitiesId,
				canAdmin: true,
			})
			.executeTakeFirst();
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
		if (community.id === unJournalId || community.id === crocCrocId) {
			return {
				title: "Failed to remove community",
				error: "Cannot remove example community",
			};
		}
		await db
			.deleteFrom("communities")
			.where("id", "=", community.id as CommunitiesId)
			.executeTakeFirst();

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
