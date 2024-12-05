"use server";

import type { CommunitiesId, PubFieldsId, PubTypesId } from "db/public";

import { db } from "~/kysely/database";
import { isUniqueConstraintError } from "~/kysely/errors";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";
import {
	FORM_NAME_UNIQUE_CONSTRAINT,
	FORM_SLUG_UNIQUE_CONSTRAINT,
	insertForm,
} from "~/lib/server/form";
import { slugifyString } from "~/lib/string";

export const addPubField = defineServerAction(async function addPubField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	await autoRevalidate(
		db.insertInto("_PubFieldToPubType").values({
			A: pubFieldId,
			B: pubTypeId,
		})
	).execute();
});

export const updateTitleField = defineServerAction(async function updateTitleField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	await db.transaction().execute(async (trx) => {
		await autoRevalidate(
			trx.updateTable("_PubFieldToPubType").set({ isTitle: false }).where("B", "=", pubTypeId)
		).execute();
		await autoRevalidate(
			trx
				.updateTable("_PubFieldToPubType")
				.set({ isTitle: true })
				.where("A", "=", pubFieldId)
				.where("B", "=", pubTypeId)
		).execute();
	});
});

export const removePubField = defineServerAction(async function removePubField(
	pubTypeId: PubTypesId,
	pubFieldId: PubFieldsId
) {
	await autoRevalidate(
		db.deleteFrom("_PubFieldToPubType").where("A", "=", pubFieldId).where("B", "=", pubTypeId)
	).execute();
});

export const removePubType = defineServerAction(async function removePubType(
	pubTypeId: PubTypesId
) {
	const pubs = await db
		.selectFrom("pubs")
		.select(({ fn }) => [fn.countAll<string>().as("count")])
		.where("pubTypeId", "=", pubTypeId)
		.executeTakeFirstOrThrow();
	const count = parseInt(pubs.count);
	if (count) {
		const fragment = count > 1 ? "pubs still use" : "pub still uses";
		return {
			title: "Unable to delete type",
			error: `${count} ${fragment} this type so it can't be deleted.`,
		};
	}

	await autoRevalidate(
		db.deleteFrom("pub_types").where("pub_types.id", "=", pubTypeId)
	).execute();
});

export const createPubType = defineServerAction(async function addPubType(
	name: string,
	communityId: CommunitiesId,
	description: string | undefined,
	fields: PubFieldsId[],
	titleField: PubFieldsId
) {
	const defaultFormName = `${name} Editor (Default)`;
	const defaultFormSlug = `${slugifyString(name)}-default-editor`;
	try {
		await db.transaction().execute(async (trx) => {
			const pubType = await autoRevalidate(
				trx
					.with("newType", (db) =>
						db
							.insertInto("pub_types")
							.values({
								communityId,
								name,
								description,
							})
							.returning("pub_types.id")
					)
					.insertInto("_PubFieldToPubType")
					.values((eb) =>
						fields.map((id) => ({
							A: id,
							B: eb.selectFrom("newType").select("id"),
							isTitle: titleField === id,
						}))
					)
					.returning("B as id")
			).executeTakeFirstOrThrow();

			await autoRevalidate(
				insertForm(pubType.id, defaultFormName, defaultFormSlug, communityId, true, trx)
			).executeTakeFirstOrThrow();
		});
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			if (error.table === "pub_types") {
				return { error: "A pub type with this name already exists" };
			}
			if (error.constraint === FORM_NAME_UNIQUE_CONSTRAINT) {
				return {
					error: `Default form creation for pub type failed. There's already a form with the name ${defaultFormName}.`,
				};
			}
			if (error.constraint === FORM_SLUG_UNIQUE_CONSTRAINT) {
				return {
					error: `Default form creation for pub type failed. There's already a form with the slug ${defaultFormSlug}.`,
				};
			}
		}
		return { error: "Pub type creation failed", cause: error };
	}
});
