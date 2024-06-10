import { db } from "~/kysely/database";
import { defineActionFormFieldServerComponent } from "../../_lib/defineConfigServerComponent";
import { action } from "../action";
import { FieldOutputMap } from "./client-components/FieldOutputMap";

const component = defineActionFormFieldServerComponent(
	action,
	"config",
	async ({ action, actionInstance, stageId, communityId }) => {
		const communityPubFields = await db
			.with("combined_results", (db) =>
				db
					.selectFrom("pub_fields")
					.distinctOn("pub_fields.id")
					.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
					.innerJoin("pubs", "pubs.id", "pub_values.pubId")
					.where("pubs.communityId", "=", communityId)
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
							.innerJoin("communities", "communities.id", "pub_types.communityId")
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

		return <FieldOutputMap pubFields={communityPubFields} />;
	}
);

export default component;
