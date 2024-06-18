import { db } from "~/kysely/database";
import { autoCache } from "~/lib/server/cache/autoCache";
import { defineActionFormFieldServerComponent } from "../../_lib/custom-form-field/defineConfigServerComponent";
import { action } from "../action";
import { FieldOutputMap } from "../config/client-components/FieldOutputMap";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ action, actionInstance, stageId, communityId, pubId }) => {
		const pubFields = await autoCache(
			db
				.selectFrom("pub_fields")
				.distinctOn("pub_fields.id")
				.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
				.innerJoin("pubs", "pubs.id", "pub_values.pubId")
				.where("pubs.id", "=", pubId)
				.select([
					"pub_fields.id",
					"pub_fields.name",
					"pub_fields.pubFieldSchemaId",
					"pub_fields.slug",
				])
		).execute();

		return <FieldOutputMap context={{ pubFields }} />;
	}
);

export default component;
