import type { Communities, Stages, StagesId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { StageSelectClient } from "./StageSelectClient";

type Props = {
	community: Communities;
	fieldLabel: string;
	fieldName: string;
	value?: StagesId;
};

export async function StageSelectServer({ community, fieldLabel, fieldName, value }: Props) {
	let stage: Stages | undefined;
	if (value !== undefined) {
		stage = await autoCache(
			db.selectFrom("stages").selectAll().where("id", "=", value)
		).executeTakeFirst();
	}
	const stages = await autoCache(
		db.selectFrom("stages").selectAll().where("communityId", "=", community.id)
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
