"use server";

import { revalidatePath } from "next/cache";

import { expect } from "utils";

import { db } from "~/kysely/database";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { UsersId } from "~/kysely/types/public/Users";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";
import { UserAndMemberships } from "~/lib/types";
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
	user: UserAndMemberships;
}) {
	if (!user.isSuperAdmin) {
		return {
			title: "Failed to create community",
			error: "User is not a super admin",
		};
	}
	if (slug === "unjournal" || slug === "croccroc") {
		return {
			title: "Failed to remove community",
			error: "Cannot remove example community",
		};
	}
	let descriptionOverload: string;
	try {
		const communityExists = await db
			.selectFrom("communities")
			.select("id") // or `selectAll()` etc
			.where("slug", "=", `${slug}`)
			.executeTakeFirst();

		if (communityExists) {
			await db
				.updateTable("communities")
				.set({
					name,
					avatar,
					slug: slugifyString(slug),
				})
				.where("id", "=", communityExists.id as CommunitiesId)
				.executeTakeFirst();

			descriptionOverload = "Community updated";
		} else {
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
					user_id: user.id as UsersId,
					community_id: c.id as CommunitiesId,
					canAdmin: true,
				})
				.executeTakeFirst();

			descriptionOverload = "Community updated";
			revalidatePath("/");
		}
		return descriptionOverload;
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
	user: UserAndMemberships;
	community: TableCommunity;
}) {
	if (!user.isSuperAdmin) {
		return {
			title: "Failed to remove community",
			error: "User is not a super admin",
		};
	}
	if (community.id === unJournalId || community.id === crocCrocId) {
		return {
			title: "Failed to remove community",
			error: "Cannot remove example community",
		};
	}
	try {
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
