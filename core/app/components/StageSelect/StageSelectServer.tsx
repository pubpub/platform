import type { Communities, CommunitiesId, Stages, StagesId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { StageSelectClient } from "./StageSelectClient";

type Props = {
	communityId: CommunitiesId;
	fieldLabel: string;
	fieldName: string;
	value?: StagesId;
};

export async function StageSelectServer({ communityId, fieldLabel, fieldName, value }: Props) {
	let stage: Stages | undefined;

	if (value !== undefined) {
		stage = await autoCache(
			db.selectFrom("stages").selectAll().where("id", "=", value)
		).executeTakeFirst();
	}

	const stages = await autoCache(
		db.selectFrom("stages").selectAll().where("communityId", "=", communityId)
	).execute();

	return (
		<StageSelectClient
			fieldLabel={fieldLabel}
			fieldName={fieldName}
			stage={stage}
			stages={stages}
		/>
	);
}
