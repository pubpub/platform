"use server";

import type { QueryCreator } from "kysely";

import type { CommunitiesId, PublicSchema, PubTypesId } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { _getPubFields } from "~/lib/server/pubFields";

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	slug: string,
	communityId: CommunitiesId,
	trx: typeof db | QueryCreator<PublicSchema> = db
) {
	try {
		return await autoRevalidate(
			trx
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
							slug,
							communityId,
						})
						.returning(["slug", "id"])
				)

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
								.over((o) => o.partitionBy("id"))
								.as("order"),
						])
				)
		).executeTakeFirstOrThrow();
	} catch (error) {
		console.log(error);
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new name` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}
});
