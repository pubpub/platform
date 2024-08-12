import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { PubsId, PubValues } from "db/public";

import {
	getPubBase,
	includeInterationInstances,
	inCludePubTypes,
	includeStagesWithIntegrations,
	nestChildren,
	NotFoundError,
	pubColumns,
} from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const PubNotFoundError = new NotFoundError("Pub not found");

export const getPubOnPubPage = (pubId: PubsId) =>
	getPubBase({ pubId }).select((eb) => [
		includeStagesWithIntegrations(eb),
		inCludePubTypes(eb),
		includeInterationInstances(eb),
		jsonArrayFrom(
			eb
				.selectFrom("children")
				.select((eb) => [
					...pubColumns,
					"children.values",
					jsonArrayFrom(
						eb
							.selectFrom("PubsInStages")
							.innerJoin("stages", "stages.id", "PubsInStages.stageId")
							.select(["PubsInStages.stageId as id", "stages.name"])
							.whereRef("PubsInStages.pubId", "=", "children.id")
					).as("stages"),
				])
				.$narrowType<{ values: PubValues }>()
		).as("children"),
	]);

export const getPubOnTheIndividualPubPage = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubOnPubPage(pubId).where("pubs.id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};
