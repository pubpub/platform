import type { CommunitiesId, UsersId } from "db/public"

import { cache } from "react"

import { getStages } from "~/lib/server/stages"

export const getStagesCached = cache(async (communityId: CommunitiesId, userId: UsersId) => {
	return getStages({ communityId, userId }).execute()
})
