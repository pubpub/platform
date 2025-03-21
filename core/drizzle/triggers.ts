import { sql } from "drizzle-orm";

import { forEach, operation, pgTrigger } from "./pg-extensions";
import { updatePubEverythingProcedure, updatePubTitleProcedure } from "./procedures";
import { pubFieldToPubType, pubValues } from "./schema"; // Import from your schema

export const insertTitleTrigger = pgTrigger("trigger_pub_field_to_pub_type_insert_pub_title")
	.on(pubFieldToPubType)
	.after(operation.insert)
	.forEach(forEach.row)
	.when(sql`NEW."isTitle" IS TRUE`)
	.execute(updatePubTitleProcedure);

export const updateTitleTrigger = pgTrigger("trigger_pub_field_to_pub_type_update_pub_title")
	.on(pubFieldToPubType)
	.after(operation.update)
	.forEach(forEach.row)
	.when(sql`NEW."isTitle" IS DISTINCT FROM OLD."isTitle"`)
	.execute(updatePubTitleProcedure);

export const deleteTitleTrigger = pgTrigger("trigger_pub_field_to_pub_type_delete_pub_title")
	.on(pubFieldToPubType)
	.after(operation.delete)
	.forEach(forEach.row)
	.when(sql`OLD."isTitle" IS TRUE`)
	.execute(updatePubTitleProcedure);

const INSERT_REF = "inserted_updated_deleted_rows" as const;

export const updatePubValuesUpdatePubTrigger = pgTrigger("trigger_update_pub_values_update_pub")
	.on(pubValues)
	.after(operation.update)
	.forEach(forEach.statement)
	.execute(updatePubEverythingProcedure)
	.referencing({
		new: INSERT_REF,
	});

export const createPubValuesUpdatePubTrigger = pgTrigger("trigger_create_pub_values_update_pub")
	.on(pubValues)
	.after(operation.insert)
	.forEach(forEach.statement)
	.execute(updatePubEverythingProcedure)
	.referencing({
		new: INSERT_REF,
	});

export const deletePubValuesUpdatePubTrigger = pgTrigger("trigger_delete_pub_values_update_pub")
	.on(pubValues)
	.after(operation.delete)
	.forEach(forEach.statement)
	.execute(updatePubEverythingProcedure)
	.referencing({
		old: INSERT_REF,
	});
