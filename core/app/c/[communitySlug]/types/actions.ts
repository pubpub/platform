"use server";

import type { CommunitiesId, PubFieldsId, PubTypesId } from "db/public";

import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

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
	try {
		await autoRevalidate(
			db
				.updateTable("_PubFieldToPubType")
				.set({ isTitle: true })
				.where("A", "=", pubFieldId)
				.where("B", "=", pubTypeId)
		).execute();
	} catch (e) {
		console.log({ e });
	}
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
	const pubType = await autoRevalidate(
		db
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
	).executeTakeFirst();
});
