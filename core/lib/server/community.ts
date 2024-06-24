import type { Prisma } from "@prisma/client";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { UsersId } from "~/kysely/types/public/Users";
import { db } from "~/kysely/database";
import { createCacheTag } from "./cache/cacheTags";
import { ONE_DAY } from "./cache/constants";
import { getCommunitySlug } from "./cache/getCommunitySlug";
import { memoize } from "./cache/memoize";

export function findCommunityBySlug(communitySlug?: string) {
	const slug = communitySlug ?? getCommunitySlug();
	return memoize(
		() => db.selectFrom("communities").select("id").where("slug", "=", slug).executeTakeFirst(),
		{
			additionalCacheKey: [slug],
			revalidateTags: [createCacheTag(`community-all_${slug}`)],
		}
	)();
}

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

export const getCommunityData = async (slug: CommunitiesId) => {
	return await db
		.selectFrom("communities")
		.where("slug", "=", slug)
		.selectAll()
		.executeTakeFirst();
};

export type CommunityData = Prisma.PromiseReturnType<typeof getCommunityData>;

export const getAvailableCommunities = async (userId: UsersId) => {
	return await db
		.selectFrom("members")
		.where("members.userId", "=", userId)
		.innerJoin("communities", "communities.id", "members.communityId")
		.selectAll("communities")
		.execute();
};
