"use server";

import type { FormsId } from "db/public";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { logError } from "~/lib/logging";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updateForm = defineServerAction(async function updateForm({
	formId,
	name,
}: {
	formId: FormsId;
	name: string;
}) {
	const { user } = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}
	try {
		const formUpdateQuery = await autoRevalidate(
			db.updateTable("forms").set({ name: name }).where("id", "=", formId)
		);
		await formUpdateQuery.execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return { error: `A form with this name already exists. Choose a new name` };
		}
		logError("error updating form name", error);
		return { error: "Form update failed" };
	}
});
