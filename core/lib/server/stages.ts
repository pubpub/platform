import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { CommunitiesId } from "db/public/Communities";

import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { pubValuesByRef } from "./pub";

// TODO: Finish making this output match the type of getCommunityStages in
// core/app/c/[communitySlug]/stages/page.tsx (add pub children and other missing joins)
export const getCommunityStages = (communityId: CommunitiesId) =>
	autoCache(
		db
			.selectFrom("stages")
			.where("communityId", "=", communityId)
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.selectAll()
				).as("move_constraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.selectAll()
				).as("move_constraint_sources"),
				jsonArrayFrom(
					eb
						.selectFrom("PubsInStages")
						.select("pubId")
						.whereRef("stageId", "=", "stages.id")
						.select(pubValuesByRef("pubId"))
				).as("pubs"),
			])
			.selectAll("stages")
			.orderBy("order asc")
	);
