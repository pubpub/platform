"use server";

import type { PubsId, StagesId, UsersId } from "db/public";

import { db } from "~/kysely/database";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { defineServerAction } from "~/lib/server/defineServerAction";

export const move = defineServerAction(async function move(
	pubId: string,
	sourceStageId: string,
	destinationStageId: string
) {
	try {
		await autoRevalidate(
			db
				.with("removed_pubsInStages", (db) =>
					db
						.deleteFrom("PubsInStages")
						.where("pubId", "=", pubId as PubsId)
						.where("stageId", "=", sourceStageId as StagesId)
				)
				.insertInto("PubsInStages")
				.values([{ pubId: pubId as PubsId, stageId: destinationStageId as StagesId }])
		).executeTakeFirstOrThrow();

		// TODO: Remove this when the above query is replaced by an
		// autoRevalidated kyseley query
		// revalidateTagsForCommunity(["PubsInStages"]);
	} catch {
		return { error: "The Pub was not successully moved" };
	}
});

export const assign = defineServerAction(async function assign(pubId: string, userId?: string) {
	try {
		await autoRevalidate(
			db
				.updateTable("pubs")
				.where("id", "=", pubId as PubsId)
				.set({
					assigneeId: userId ? (userId as UsersId) : null,
				})
		).executeTakeFirstOrThrow();

		// revalidateTagsForCommunity(["pubs"]);
	} catch {
		return { error: "The Pub was not successully assigned" };
	}
});
