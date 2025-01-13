import type { Communities, CommunitiesId, Stages, StagesId } from "db/public"

import { db } from "~/kysely/database"
import { autoCache } from "~/lib/server/cache/autoCache"
import { StageSelectClient } from "./StageSelectClient"

type Props = {
	communityId: CommunitiesId
	fieldLabel: string
	fieldName: string
}

export async function StageSelectServer({ communityId, fieldLabel, fieldName }: Props) {
	const stages = await autoCache(
		db.selectFrom("stages").selectAll().where("communityId", "=", communityId)
	).execute()

	return <StageSelectClient fieldLabel={fieldLabel} fieldName={fieldName} stages={stages} />
}
