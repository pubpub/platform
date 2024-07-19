"use server";

import type { FormsId } from "db/public";
import { logger } from "logger";

import type { FormBuilderSchema } from "./types";
import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const saveForm = defineServerAction(async function saveForm(form: FormBuilderSchema) {
	logger.debug({ msg: "saving form" });
	const { elements, formId } = form;
	try {
		await autoRevalidate(
			db
				.updateTable("form_elements")
				.set({})
				.where("formId", "=", formId as FormsId)
		).executeTakeFirstOrThrow();
	} catch (error) {
		logger.error({ msg: "error saving form", error });
		return { error: "Unable to save form" };
	}
});

export const archiveForm = defineServerAction(async function archiveForm(id: FormsId) {
	try {
		await autoRevalidate(
			db.updateTable("forms").set({ isArchived: true }).where("forms.id", "=", id)
		).executeTakeFirstOrThrow();
	} catch (error) {
		logger.error({ msg: "error archiving form", error });
		return { error: "Unable to archive form" };
	}
});
