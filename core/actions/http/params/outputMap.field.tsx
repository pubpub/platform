import { db } from "~/kysely/database";
import { defineActionFormFieldServerComponent } from "../../_lib/defineConfigServerComponent";
import { action } from "../action";
import { FieldOutputMap } from "../config/client-components/FieldOutputMap";

const component = defineActionFormFieldServerComponent(
	action,
	"params",
	async ({ action, actionInstance, stageId, communityId, pubId }) => {
		const pubFields = await db
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

			.execute();

		return <FieldOutputMap pubFields={pubFields} />;
	}
);

export default component;
