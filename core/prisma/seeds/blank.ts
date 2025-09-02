import type { CommunitiesId } from "db/public";

import { seedCommunity } from "../seed/seedCommunity";
import { usersExisting } from "./users";

export async function seedBlank(communityId?: CommunitiesId) {
	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "Blank",
				slug: "blank",
			},
			users: {
				...usersExisting,
			},
		},
		{
			randomSlug: false,
		}
	);
}
