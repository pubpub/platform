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
			apiTokens: {
				allToken: {
					id: "22222222-2222-2222-2222-222222222222.zzzzzzzzzzzzzzzz",
				},
			},
		},
		{
			randomSlug: false,
		}
	);
}
