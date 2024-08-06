import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { CommunitiesId, PubsId, PubValues } from "db/public";

import {
	getPubBase2,
	nestChildren,
	NotFoundError,
	pubAssignee,
	pubColumns,
	pubValuesByRef,
	pubValuesByVal,
	withPubChildren,
} from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const PubNotFoundError = new NotFoundError("Pub not found");
export const getPubPage = (pubId: PubsId) =>
	withPubChildren({pubId})
		.selectFrom("pubs")
		.select((eb) => [
			...pubColumns,
			pubAssignee(eb),
			jsonArrayFrom(
				eb
					.selectFrom("PubsInStages")
					.innerJoin("stages", "stages.id", "PubsInStages.stageId")
					.select(["PubsInStages.stageId as id", "stages.name"])
					.whereRef("PubsInStages.pubId", "=", "pubs.id")
					.select((eb) =>
						jsonArrayFrom(
							eb
								.selectFrom("integration_instances")
								.where("integration_instances.stageId", "=", eb.ref("stages.id"))
								.innerJoin(
									"integrations",
									"integrations.id",
									"integration_instances.integrationId"
								)
								.select((eb) =>
									jsonObjectFrom(
										eb
											.selectFrom("integrations")
											.where(
												"integrations.id",
												"=",
												eb.ref("integration_instances.integrationId")
											)
											.selectAll()
									).as("integration")
								)
								.selectAll()
						).as("integrationInstances")
					)
			).as("stages"),
			jsonArrayFrom(
				eb
					.selectFrom("children")
					.select((eb) => [
						...pubColumns,
						"children.values",
						jsonArrayFrom(
							eb
								.selectFrom("PubsInStages")
								.select(["PubsInStages.stageId as id"])
								.whereRef("PubsInStages.pubId", "=", "children.id")
						).as("stages"),
					])
					.$narrowType<{ values: PubValues }>()
			).as("children"),
		])
		.select((eb) =>
			jsonObjectFrom(
				eb
					.selectFrom("pub_types")
					.where("pub_types.id", "=", eb.ref("pubs.pubTypeId"))
					.selectAll()
			).as("pubType")
		)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("action_claim")
					.where("action_claim.pubId", "=", eb.ref("pubs.id"))
					.innerJoin("users", "users.id", "action_claim.userId")
					.select((eb) =>
						jsonObjectFrom(
							eb
								.selectFrom("users")
								.where("users.id", "=", eb.ref("action_claim.userId"))
								.selectAll()
						).as("user")
					)
					.selectAll()
			).as("claims")
		)
		.select((eb) =>
			jsonArrayFrom(
				eb
					.selectFrom("integration_instances")
					.where("integration_instances.communityId", "=", eb.ref("pubs.communityId"))
					.selectAll()
			).as("integrationInstances")
		)
		.select((eb) =>
			jsonObjectFrom(
				eb
					.selectFrom("pub_types")
					.where("pub_types.id", "=", eb.ref("pubs.pubTypeId"))
					.selectAll()
			).as("pubType")
		)
		.$if(!!pubId, (eb) => eb.select(pubValuesByVal(pubId!)))
		.$narrowType<{ values: PubValues }>();

export const getPubOnTheIndividualPubPage = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase2({ pubId }).where("pubs.id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};
