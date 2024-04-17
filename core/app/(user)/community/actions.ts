"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { expect } from "utils";

import { corePubFields } from "~/actions/corePubFields";
import { db } from "~/kysely/database";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { PubTypesId } from "~/kysely/types/public/PubTypes";
import { UsersId } from "~/kysely/types/public/Users";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";
import { UserAndMemberships } from "~/lib/types";
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
			error: "Cannot update example community",
		};
	}
	try {
		const communityExists = await db
			.selectFrom("communities")
			.selectAll() // or `selectAll()` etc
			.where("slug", "=", `${slug}`)
			.executeTakeFirst();

		if (communityExists) {
			return {
				title: "Failed to create community",
				error: "Community with that slug already exists",
			};
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
			const communityUUID = c.id as CommunitiesId;
			const member = await db
				.insertInto("members")
				.values({
					user_id: user.id as UsersId,
					community_id: c.id as CommunitiesId,
					canAdmin: true,
				})
				.returning("id")
				.executeTakeFirst();

			const pubTypeId: string = uuidv4();

			const corePubSlugs = corePubFields.map((field) => field.slug);

			const [title] = await db
				.selectFrom("pub_fields")
				.selectAll()
				.where("pub_fields.slug", "=", corePubSlugs)
				.execute();

			await db
				.with("core_pub_type", (db) =>
					db
						.insertInto("pub_types")
						.values({
							id: pubTypeId as PubTypesId,
							name: "Title Pub That Only List Titles",
							community_id: c.id as CommunitiesId,
						})
						.returning("id")
				)
				.insertInto("_PubFieldToPubType")
				.values((eb) => ({
					A: title.id,
					B: eb.selectFrom("core_pub_type").select("id"),
				}))
				.execute();
			const stages = (
				await db
					.insertInto("stages")
					.values([
						{
							community_id: communityUUID,
							name: "Submitted",
							order: "aa",
						},
						{
							community_id: communityUUID,
							name: "Ask Author for Consent",
							order: "bb",
						},
						{
							community_id: communityUUID,
							name: "To Evaluate",
							order: "cc",
						},
						{
							community_id: communityUUID,
							name: "Under Evaluation",
							order: "dd",
						},
						{
							community_id: communityUUID,
							name: "In Production",
							order: "ff",
						},
						{
							community_id: communityUUID,
							name: "Published",
							order: "gg",
						},
						{
							community_id: communityUUID,
							name: "Shelved",
							order: "hh",
						},
					])
					.returning("id")
					.execute()
			).map((x) => x.id);

			await db
				.with("new_permission", (db) =>
					db
						.insertInto("permissions")
						.values({
							member_id: member?.id,
						})
						.returning("id")
				)
				.insertInto("_PermissionToStage")
				.values((eb) => [
					{
						A: eb.selectFrom("new_permission").select("id"),
						B: stages[0],
					},
					{
						A: eb.selectFrom("new_permission").select("id"),
						B: stages[1],
					},
					{
						A: eb.selectFrom("new_permission").select("id"),
						B: stages[2],
					},
					{
						A: eb.selectFrom("new_permission").select("id"),
						B: stages[3],
					},
				])
				.execute();

			await db
				.insertInto("move_constraint")
				.values([
					{
						//  Submitted can be moved to: Consent, To Evaluate, Under Evaluation, Shelved
						stage_id: stages[0],
						destination_id: stages[1],
					},
					{
						stage_id: stages[1],
						destination_id: stages[2],
					},
					{
						stage_id: stages[2],
						destination_id: stages[3],
					},
					{
						stage_id: stages[3],
						destination_id: stages[4],
					},
					{
						stage_id: stages[4],
						destination_id: stages[5],
					},
				])
				.execute();

			await db
				.with("new_pubs", (db) =>
					db
						.insertInto("pubs")
						.values({
							community_id: communityUUID,
							pub_type_id: pubTypeId as PubTypesId,
						})
						.returning("id")
				)
				.with("pubs_in_stages", (db) =>
					db.insertInto("PubsInStages").values((eb) => [
						{
							pubId: eb.selectFrom("new_pubs").select("id"),
							stageId: stages[0],
						},
					])
				)
				.insertInto("pub_values")
				.values((eb) => [
					{
						pub_id: eb.selectFrom("new_pubs").select("new_pubs.id"),
						field_id: title.id,
						value: '"The Activity of Slugs I. The Induction of Activity by Changing Temperatures"',
					},
				])
				.execute();
		}
		revalidatePath("/");
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
