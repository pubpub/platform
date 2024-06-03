import { unstable_cache } from "next/cache";

import { db } from "~/kysely/database";
import { PubsId } from "~/kysely/types/public/Pubs";

export function findCommunityBySlug(communitySlug: string) {
	return db
		.selectFrom("communities")
		.select("id")
		.where("slug", "=", communitySlug)
		.executeTakeFirst();
}

// Retrieve the pub's community id in order to revalidate the next server
// cache after the action is run.
export const findCommunityIdByPubId = async (pubId: PubsId) => {
	const { communityId } =
		(await unstable_cache(
			async () =>
				db
					.selectFrom("pubs")
					.select(["community_id as communityId"])
					.where("id", "=", pubId)
					.executeTakeFirst(),
			[pubId],
			{
				revalidate: 60 * 60 * 24 * 7,
			}
		)()) ?? {};

	return communityId;
};
