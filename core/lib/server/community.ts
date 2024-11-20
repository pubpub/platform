import { cache } from "react";

import type { PubsId, UsersId } from "db/public";

import { db } from "~/kysely/database";
import { createCacheTag } from "./cache/cacheTags";
import { ONE_DAY } from "./cache/constants";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { memoize } from "./cache/memoize";

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

export type CommunityData = Awaited<ReturnType<typeof findCommunityByPubId>>;

// TODO: cache this
export const getAvailableCommunities = async (userId: UsersId) => {
	return await db
		.selectFrom("community_memberships")
		.where("community_memberships.userId", "=", userId)
		.innerJoin("communities", "communities.id", "community_memberships.communityId")
		.selectAll("communities")
		.execute();
};

export type AvailableCommunitiesData = Awaited<ReturnType<typeof getAvailableCommunities>>;
