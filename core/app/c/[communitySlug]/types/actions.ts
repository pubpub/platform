"use server";

import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubTypesId } from "~/kysely/types/public/PubTypes";
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
		.select(({ fn }) => [fn.countAll().as("count")])
		.where("pubTypeId", "=", pubTypeId)
		.$narrowType<{ count: number }>()
		.executeTakeFirst();

	if (pubs?.count) {
		return {
			title: "Unable to delete type",
			error: `${pubs.count} pubs still use this type so it can't be deleted.`,
		};
	}

	await autoRevalidate(
		db.deleteFrom("pub_types").where("pub_types.id", "=", pubTypeId)
	).execute();
});

export const addPubType = defineServerAction(async function addPubType(
	name: string,
	communityId: CommunitiesId,
	description: string
) {
	await autoRevalidate(
		db.insertInto("pub_types").values({
			communityId,
			name,
			description,
		})
	).executeTakeFirst();
});
