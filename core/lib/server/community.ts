import type { Prisma } from "@prisma/client";

import { cache } from "react";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { PubsId, UsersId } from "db/public";

import { db } from "~/kysely/database";
import { createCacheTag } from "./cache/cacheTags";
import { ONE_DAY } from "./cache/constants";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { memoize } from "./cache/memoize";

/**
 * Do not add any additional selects to this query.
 * This is meant to be the canonical way to get a community, should be very fast and small.
 */
export const findCommunityBySlug = cache((communitySlug?: string) => {
	const slug = communitySlug ?? getCommunitySlug();
	return memoize(
		() => db.selectFrom("communities").selectAll().where("slug", "=", slug).executeTakeFirst(),
		{
			additionalCacheKey: [slug],
			revalidateTags: [createCacheTag(`community-all_${slug}`)],
		}
	)();
});

// Retrieve the pub's community id in order to revalidate the next server
// cache after the action is run.
export const findCommunityByPubId = memoize(
	async (pubId: PubsId) => {
		const community = db
			.selectFrom("pubs")
			.where("pubs.id", "=", pubId)
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.select([
				"communities.id",
				"communities.slug",
				"communities.avatar",
				"communities.name",
				"communities.slug",
				"communities.createdAt",
				"communities.updatedAt",
			])
			.executeTakeFirst();

		return community;
	},
	{ revalidateTags: ["all", "all-pubs"], duration: ONE_DAY }
);

export type CommunityData = Prisma.PromiseReturnType<typeof findCommunityBySlug>;

// TODO: cache this
export const getAvailableCommunities = async (userId: UsersId) => {
	return await db
		.selectFrom("members")
		.where("members.userId", "=", userId)
		.innerJoin("communities", "communities.id", "members.communityId")
		.selectAll("communities")
		.execute();
};

export type AvailableCommunitiesData = Prisma.PromiseReturnType<typeof getAvailableCommunities>;
