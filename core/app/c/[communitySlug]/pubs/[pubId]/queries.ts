import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { PubsId } from "~/kysely/types/public/Pubs";
import { getPubBase, nestChildren, NotFoundError } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const PubNotFoundError = new NotFoundError("Pub not found");

export const getPubOnTheIndividualPubPage = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase({ pubId })
			.where("pubs.id", "=", pubId)
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
						.selectFrom("PubsInStages")
						.where("PubsInStages.pubId", "=", pubId)
						.innerJoin("stages", "stages.id", "PubsInStages.stageId")
						.select((eb) =>
							jsonArrayFrom(
								eb
									.selectFrom("integration_instances")
									.where(
										"integration_instances.stageId",
										"=",
										eb.ref("stages.id")
									)
									.selectAll()
							).as("integrationInstances")
						)
						.selectAll()
				).as("stages")
			)
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("action_claim")
						.where("action_claim.pubId", "=", eb.ref("pubs.id"))
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
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};
