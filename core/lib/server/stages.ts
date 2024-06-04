import { StringReference } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import { db } from "~/kysely/database";
import Database from "~/kysely/types/Database";
import { pubValuesByRef } from "./pub";

// TODO: Finish making this output match the type of getCommunityStages in
// core/app/c/[communitySlug]/stages/page.tsx (add pub children and other missing joins)
export const getCommunityStages = async (communitySlug: string) => {
	const community = await db
		.selectFrom("communities")
		.where("slug", "=", communitySlug)
		.select("id")
		.executeTakeFirst();

	if (!community) {
		return null;
	}

	const stages = await db
		.selectFrom("stages")
		.where("communityId", "=", community.id)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("move_constraint")
					.whereRef("move_constraint.stageId", "=", "stages.id")
					.selectAll()
			).as("move_constraints")
		)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("move_constraint")
					.whereRef("move_constraint.destinationId", "=", "stages.id")
					.selectAll()
			).as("move_constraint_sources")
		)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("PubsInStages")
					.select("pubId")
					.whereRef("stageId", "=", "stages.id")
					.select(pubValuesByRef("pubId"))
			).as("pubs")
		)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("integration_instances")
					.whereRef("integration_instances.stageId", "=", "stages.id")
					.innerJoin(
						"integrations",
						"integrations.id",
						"integration_instances.integrationId"
					)
					.select([
						"integration_instances.id as instanceId",
						"integration_instances.config",
						"integration_instances.name as instance_name",
						"integrations.name as integration_name",
						"integration_instances.integrationId",
						"integrations.actions",
						"integrations.settingsUrl",
					])
			).as("integrations")
		)
		.selectAll("stages")
		.orderBy("order asc")
		.execute();

	return stages;
};
