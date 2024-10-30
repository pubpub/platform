"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import type { CommunitiesId, MembersId, PubTypesId, UsersId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";
import { expect } from "utils";

import type { TableCommunity } from "./getCommunityTableColumns";
import { corePubFields } from "~/actions/corePubFields";
import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";

export const createCommunity = defineServerAction(async function createCommunity({
	name,
	slug,
	avatar,
}: {
	name: string;
	slug: string;
	avatar?: string;
}) {
	const { user } = await getLoginData();

	if (!user) {
		return {
			title: "Failed to create community",
			error: "Not logged in",
		};
	}

	if (!user.isSuperAdmin) {
		return {
			title: "Failed to create community",
			error: "User is not a super admin",
		};
	}
	if (slug === "unjournal" || slug === "croccroc") {
		return {
			title: "Failed to remove community",
			error: "Cannot update example community",
		};
	}
	try {
		await autoRevalidate(
			db
				.with("new_community", (db) =>
					db
						.insertInto("communities")
						.values({
							name,
							slug: slugifyString(slug),
							avatar,
						})
						.returning("id")
				)
				.with("community_membership", (db) =>
					db
						.insertInto("community_memberships")
						.values((eb) => ({
							userId: user.id,
							communityId: eb.selectFrom("new_community").select("new_community.id"),
							role: MemberRole.admin,
						}))
						.returning("community_memberships.id")
				)
				.insertInto("members")
				.values((eb) => ({
					id: eb
						.selectFrom("community_membership")
						.select("community_membership.id") as unknown as MembersId,
					userId: user.id,
					communityId: eb.selectFrom("new_community").select("new_community.id"),
					role: MemberRole.admin,
				}))
				.returning("id"),
			{ communitySlug: slug }
		).executeTakeFirstOrThrow();
		revalidatePath("/");
	} catch (error) {
		if (isUniqueConstraintError(error) && error.constraint === "communities_slug_key") {
			return {
				title: "Failed to create community",
				error: "A community with that slug already exists",
				cause: error,
			};
		}
		return {
			title: "Failed to create community",
			error: "An unexpected error occurred",
			cause: error,
		};
	}
});

export const removeCommunity = defineServerAction(async function removeCommunity({
	community,
}: {
	community: TableCommunity;
}) {
	const { user } = await getLoginData();

	if (!user) {
		return {
			title: "Failed to remove community",
			error: "Not logged in",
		};
	}

	if (!user.isSuperAdmin) {
		return {
			title: "Failed to remove community",
			error: "User is not a super admin",
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
