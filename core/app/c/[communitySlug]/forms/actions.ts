"use server";

import { logger } from "logger";

import type { PubTypesId } from "~/kysely/types/public/PubTypes";
import { db, isUniqueConstraintError } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { slugifyString } from "~/lib/string";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string
) {
	try {
		const { slug } = await autoRevalidate(
			db
				.insertInto("forms")
				.values({
					name,
					pubTypeId,
					slug: slugifyString(name),
				})
				.returning("slug")
		).executeTakeFirstOrThrow();
		return slug;
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new name` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});
