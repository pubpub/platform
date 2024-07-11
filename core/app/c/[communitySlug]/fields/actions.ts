"use server";

import { CoreSchemaType } from "schemas";

import { db } from "~/kysely/database";
import { PubFieldsId } from "~/kysely/types/public/PubFields";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const createField = defineServerAction(async function createField(
	name: string,
	slug: string,
	schemaName: CoreSchemaType
) {
	try {
		await autoRevalidate(
			db.insertInto("pub_fields").values({ name, slug, schemaName })
		).execute();
	} catch (error) {
		return {
			error: "Failed to create field",
			cause: error,
		};
	}
});

export const updateFieldName = defineServerAction(async function updateFieldName(
	fieldId: string,
	name: string
) {
	try {
		await autoRevalidate(
			db
				.updateTable("pub_fields")
				.where("id", "=", fieldId as PubFieldsId)
				.set({ name })
		).execute();
	} catch (error) {
		return {
			error: "Failed to update field name",
			cause: error,
		};
	}
});

export const archiveField = defineServerAction(async function archiveField(fieldId: string) {
	try {
		await autoRevalidate(
			db
				.updateTable("pub_fields")
				.where("id", "=", fieldId as PubFieldsId)
				.set({ isArchived: true })
		).execute();
	} catch (error) {
		return {
			error: "Failed to archive field",
			cause: error,
		};
	}
});
