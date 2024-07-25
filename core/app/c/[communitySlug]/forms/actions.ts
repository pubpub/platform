"use server";

import type { CommunitiesId, FormsId, PubTypesId } from "db/public";
import { logger } from "logger";

import { db, isUniqueConstraintError } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { _getPubFields, getPubFields } from "~/lib/server/pubFields";
import { slugifyString } from "~/lib/string";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	communityId: CommunitiesId
) {
	try {
		const { slug } = await autoRevalidate(
			db
				.with("fields", () =>
					_getPubFields({ pubTypeId })
						.clearSelect()
						.select((eb) => [
							eb.ref("f.id").as("fieldId"),
							eb.ref("f.json", "->>").key("name").as("name"),
						])
				)
				.with("form", (db) =>
					db
						.insertInto("forms")
						.values({
							name,
							pubTypeId,
							slug: slugifyString(name),
							communityId,
						})
						.returning(["slug", "id"])
				)
				.with("elements", (db) =>
					db
						.insertInto("form_elements")
						.columns(["fieldId", "formId", "label", "type", "order"])
						.expression((eb) =>
							eb
								.selectFrom("fields")
								.innerJoin("form", (join) => join.onTrue())
								.select((eb) => [
									"fields.fieldId",
									"form.id as formId",
									"fields.name as label",
									eb.val("pubfield").as("type"),
									eb.fn
										.agg<number>("ROW_NUMBER")
										.over((o) => o.partitionBy("form.id"))
										.as("order"),
								])
						)
				)
				.selectFrom("form")
				.select("form.slug")
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
