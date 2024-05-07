"use server";

import { logger } from "logger";

import type { action } from "./action";
import { db } from "~/kysely/database";
import { PubsId } from "~/kysely/types/public/Pubs";
import { StagesId } from "~/kysely/types/public/Stages";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, stageId }) => {
	try {
		await db.transaction().execute(async (trx) => {
			// Remove the pub from the current stage.
			await trx
				.deleteFrom("PubsInStages")
				.where("pubId", "=", pub.id as PubsId)
				.where("stageId", "=", stageId)
				.execute();

			// Add the pub to the destination stage.
			return await trx
				.insertInto("PubsInStages")
				.values({
					pubId: pub.id as PubsId,
					stageId: config.stage as StagesId,
				})
				.execute();
		});
	} catch (error) {
		logger.error({ msg: "move", error });
		return {
			title: "Failed to move pub",
			error: "An error occured while moving the pub",
			cause: error,
		};
	}

	logger.info({ msg: "move", pub, config });

	return {
		success: true,
		report: "Pub moved",
		data: {},
	};
});
