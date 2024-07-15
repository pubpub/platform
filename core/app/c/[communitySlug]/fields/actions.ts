"use server";

import type { CoreSchemaType } from "schemas";

import { logger } from "logger";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import { db, isUniqueConstraintError } from "~/kysely/database";
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
		if (isUniqueConstraintError(error)) {
			return { error: `A field with this name already exists. Choose a new name` };
		}
		logger.error({ msg: "error creating field", error });
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
