"use server";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updateForm = defineServerAction(async function updateForm({ formId, name }) {
	const user = await getLoginData();

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
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});
