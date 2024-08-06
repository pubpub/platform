import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { PubsId } from "db/public";

import { getPubBase2, nestChildren, NotFoundError } from "~/lib/server";
import { autoCache } from "~/lib/server/cache/autoCache";

const PubNotFoundError = new NotFoundError("Pub not found");

export const getPubOnTheIndividualPubPage = async (pubId: PubsId) => {
	const pub = await autoCache(
		getPubBase2({ pubId }).where("pubs.id", "=", pubId)
	).executeTakeFirst();

	if (!pub) {
		throw PubNotFoundError;
	}

	return nestChildren(pub);
};
