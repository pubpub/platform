"use server";

import { redirect } from "next/navigation";
import { sql } from "kysely";
import { componentsBySchema } from "schemas";

import type { CommunitiesId, CoreSchemaType, InputComponent, PubTypesId } from "db/public";
import { logger } from "logger";
import { assert, expect } from "utils";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { getLoginData } from "~/lib/authentication/loginData";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { findCommunityBySlug } from "~/lib/server/community";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { _getPubFields } from "~/lib/server/pubFields";

const componentsBySchemaTable = Object.entries(componentsBySchema)
	.map(([schema, components]) => {
		const component = components[0]
			? `'${components[0]}'::"InputComponent"`
			: `null::"InputComponent"`;
		return `('${schema}'::"CoreSchemaType", ${component})`;
	})
	.join(", ");

export const createForm = defineServerAction(async function createForm(
	pubTypeId: PubTypesId,
	name: string,
	slug: string,
	communityId: CommunitiesId
) {
	const user = await getLoginData();

	if (!user) {
		return {
			error: "Not logged in",
		};
	}

	try {
		await autoRevalidate(
			db
				.with("components", (db) =>
					// This lets us set an appropriate default component during creation by turning
					// the js mapping from schemaName to InputComponent into a temporary table which
					// can be used during the query. Without this, we would need to first query for
					// the pubtype's fields (and their schemaNames), then determine the input
					// components in js before inserting
					db
						.selectFrom(
							sql<{
								schema: CoreSchemaType;
								component: InputComponent;
							}>`(values ${sql.raw(componentsBySchemaTable)})`.as<"c">(
								sql`c(schema, component)`
							)
						)
						.selectAll("c")
				)
				.with("fields", () =>
					_getPubFields({ pubTypeId, communityId })
						.clearSelect()
						.select((eb) => [
							eb.ref("f.id").as("fieldId"),
							eb.ref("f.json", "->>").key("name").as("name"),
							eb
								.cast<CoreSchemaType>(
									eb.ref("f.json", "->>").key("schemaName"),
									sql.raw('"CoreSchemaType"')
								)
								.as("schemaName"),
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
				.columns(["fieldId", "formId", "label", "type", "order", "component"])
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
							eb
								.selectFrom("components")
								.select("component")
								.whereRef("components.schema", "=", "fields.schemaName")
								.as("component"),
						])
				)
		).executeTakeFirstOrThrow();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			const column = error.constraint === "forms_slug_key" ? "slug" : "name";
			return { error: `A form with this ${column} already exists. Choose a new ${column}` };
		}
		logger.error({ msg: "error creating form", error });
		return { error: "Form creation failed" };
	}

	const community = await findCommunityBySlug();
	assert(community);
	redirect(`/c/${community.slug}/forms/${slug}/edit`);
});
