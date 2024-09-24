"use server";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/auth/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const updateForm = defineServerAction(async function updateForm({ communityId, name }) {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}
	try {
		const form = await autoRevalidate(
			db
				.updateTable("forms")
				.set({ name: name })
				.where("communityId", "=", communityId)
				.returning("id")
		);
		console.log(form);
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new ${column}` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});
