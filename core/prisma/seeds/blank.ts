import type { CommunitiesId, UsersId } from "db/public";

import { env } from "~/lib/env/env";
import { seedCommunity } from "../seed/seedCommunity";

export async function seedBlank(communityId?: CommunitiesId) {
	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "Blank",
				slug: "blank",
			},
		},
		{
			randomSlug: false,
		}
	);
}
