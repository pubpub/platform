import type { ExpressionBuilder, ExpressionWrapper } from "kysely";

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { Database } from "db/Database";
import type { CommunitiesId, PubsId, StagesId } from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";

export const getCommunityById = <EB extends ExpressionBuilder<Database, keyof Database>>(
	eb: EB,
	communityId: CommunitiesId | ExpressionWrapper<Database, "stages", CommunitiesId>
) => {
	const query = eb.selectFrom("communities").select((eb) => [
		"communities.id",
		"communities.slug",
		jsonArrayFrom(
			eb
				.selectFrom("pub_types")
				.select((eb) => [
					"pub_types.id",
					"pub_types.name",
					"pub_types.description",
					"pub_types.communityId",
					jsonArrayFrom(
						eb
							.selectFrom("pub_fields")
							.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
							.select((eb) => [
								"pub_fields.id",
								"pub_fields.name",
								"pub_fields.pubFieldSchemaId",
								"pub_fields.slug",
								"pub_fields.name",
								"pub_fields.schemaName",
								jsonObjectFrom(
									eb
										.selectFrom("PubFieldSchema")
										.select([
											"PubFieldSchema.id",
											"PubFieldSchema.namespace",
											"PubFieldSchema.name",
											"PubFieldSchema.schema",
										])
										.whereRef(
											"PubFieldSchema.id",
											"=",
											eb.ref("pub_fields.pubFieldSchemaId")
										)
								).as("schema"),
							])
							.where("pub_fields.isRelation", "=", false)
							.where("_PubFieldToPubType.B", "=", eb.ref("pub_types.id"))
					).as("fields"),
				])
				.whereRef("pub_types.communityId", "=", eb.ref("communities.id"))
		).as("pubTypes"),
		jsonArrayFrom(
			eb
				.selectFrom("stages")
				.select(["stages.id", "stages.name", "stages.order"])
				.orderBy("stages.order desc")
				.whereRef("stages.communityId", "=", eb.ref("communities.id"))
 		).as("stages"),
	]).where("communities.id", "=", communityId);

	return autoCache(query);
};

export const getStage = (stageId: StagesId) =>
	autoCache(
		db
			.selectFrom("stages")
			.select((eb) => [
				"stages.id",
				"stages.communityId",
				"stages.name",
				"stages.order",
				jsonObjectFrom(getCommunityById(eb, eb.ref("stages.communityId")).qb)
					.$notNull()
					.as("community"),
			])
			.where("stages.id", "=", stageId)
	);

export const availableStagesAndCurrentStage = ({
	pubId,
	communityId,
}: {
	pubId: PubsId;
	communityId: CommunitiesId;
}) =>
	autoCache(
		db
			.with("currentStageId", (eb) =>
				eb
					.selectFrom("PubsInStages")
					.select(["stageId as currentStageId"])
					.where("PubsInStages.pubId", "=", pubId)
			)
			.selectFrom("stages")
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.select(["id", "name", "order"])
						.whereRef(
							"stages.id",
							"=",
							eb.selectFrom("currentStageId").select("currentStageId")
						)
				).as("stageOfCurrentPub"),
				jsonArrayFrom(
					eb
						.selectFrom("stages")
						.select(["id", "name", "order"])
						.orderBy("order desc")
						.where("stages.communityId", "=", communityId as CommunitiesId)
				).as("availableStagesOfCurrentPub"),
			])
	);
