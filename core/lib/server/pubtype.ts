import { sql } from "kysely";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";

export const getTypes = (communitySlug: string) =>
	autoCache(
		db
			.selectFrom("pub_types")
			.innerJoin("communities", "communities.id", "pub_types.communityId")
			.where("communities.slug", "=", communitySlug)
			.select([
				"pub_types.id",
				"pub_types.name",
				"pub_types.description",
				(eb) =>
					eb
						.selectFrom("_PubFieldToPubType")
						.whereRef("B", "=", "pub_types.id")
						.select((eb) =>
							eb.fn.coalesce(eb.fn.agg("array_agg", ["A"]), sql`'{}'`).as("fields")
						)
						.as("fields"),
			])
			// This type param could be passed to eb.fn.agg above, but $narrowType would still be required to assert that fields is not null
			.$narrowType<{ fields: PubFieldsId[] }>()
	);
