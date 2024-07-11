"use server";

import type { CoreSchemaType } from "schemas";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";

export const createField = defineServerAction(async function createField(
	name: string,
	schemaName: CoreSchemaType
) {
	try {
		const { slug } = await autoRevalidate(
			db
				.insertInto("pub_fields")
				.values({ name, slug: slugifyString(name), schemaName })
				.returning("slug")
		).executeTakeFirstOrThrow();
		return slug;
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
