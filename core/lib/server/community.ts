import type { CommunitiesId, PubsId } from "db/public"

import { cache } from "react"

import { db } from "~/kysely/database"
import { createCacheTag } from "./cache/cacheTags"
import { ONE_DAY } from "./cache/constants"
import { getCommunitySlug } from "./cache/getCommunitySlug"
import { memoize } from "./cache/memoize"

export const findCommunityBySlug = cache(async (communitySlug?: string) => {
	const slug = communitySlug ?? (await getCommunitySlug())
	return memoize(
		() => db.selectFrom("communities").selectAll().where("slug", "=", slug).executeTakeFirst(),
		{
			additionalCacheKey: [slug],
			revalidateTags: [createCacheTag(`community-all_${slug}`)],
		}
	)()
})

export const getCommunity = memoize(
	async (communityId: CommunitiesId) => {
		return db
			.selectFrom("communities")
			.selectAll()
			.where("id", "=", communityId)
			.executeTakeFirst()
	},
	{ revalidateTags: ["all", "all-communities"], duration: ONE_DAY }
)

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
			.executeTakeFirst()

		return community
	},
	{ revalidateTags: ["all", "all-pubs"], duration: ONE_DAY }
)

export type CommunityData = Awaited<ReturnType<typeof findCommunityByPubId>>
