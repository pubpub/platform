import { defineActionContext } from "~/actions/_lib/defineFormContext";
import { db } from "~/kysely/database";
import { action } from "../action";

// import { context } from "./context";

const configContext = defineActionContext(
	action,
	"config",
	{ pubFields: [] },
	async ({ communityId }) => {
		const communityPubFields = await db
			.with("combined_results", (db) =>
				db
					.selectFrom("pub_fields")
					.distinctOn("pub_fields.id")
					.innerJoin("pub_values", "pub_values.field_id", "pub_fields.id")
					.innerJoin("pubs", "pubs.id", "pub_values.pub_id")
					.where("pubs.community_id", "=", communityId)
					.select([
						"pub_fields.id",
						"pub_fields.name",
						"pub_fields.pubFieldSchemaId",
						"pub_fields.slug",
					])

					.unionAll(
						db
							.selectFrom("pub_fields")
							.distinctOn("pub_fields.id")
							.innerJoin(
								"_PubFieldToPubType",
								"pub_fields.id",
								"_PubFieldToPubType.A"
							)
							.innerJoin("pub_types", "pub_types.id", "_PubFieldToPubType.B")
							.innerJoin("communities", "communities.id", "pub_types.community_id")
							.where("communities.id", "=", communityId)
							.select([
								"pub_fields.id",
								"pub_fields.name",
								"pub_fields.pubFieldSchemaId",
								"pub_fields.slug",
							])
					)
			)
			.selectFrom("combined_results")
			.select([
				"combined_results.id",
				"combined_results.name",
				"combined_results.pubFieldSchemaId",
				"combined_results.slug",
			])
			.distinct()
			.execute();

		return { pubFields: communityPubFields };
	}
);
export default configContext;
