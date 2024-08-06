import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { PubsId } from "db/public";

import { getPubBase2, nestChildren, NotFoundError } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const PubNotFoundError = new NotFoundError("Pub not found");

export const getPubOnTheIndividualPubPage = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase2({ pubId })
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
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};
