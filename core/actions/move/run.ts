"use server"

import type { PubsId, StagesId } from "db/public"
import { logger } from "logger"

import type { action } from "./action"
import { db } from "~/kysely/database"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { defineRun } from "../types"

export const run = defineRun<typeof action>(async ({ pub, config, stageId }) => {
	try {
		await autoRevalidate(
			db
				.with("leave-stage", (db) =>
					db
						.deleteFrom("PubsInStages")
						.where("pubId", "=", pub.id as PubsId)
						.where("stageId", "=", stageId)
				)
				.insertInto("PubsInStages")
				.values({
					pubId: pub.id as PubsId,
					stageId: config.stage as StagesId,
				})
		).execute()
	} catch (error) {
		logger.error({ msg: "move", error })
		return {
			title: "Failed to move pub",
			error: "An error occured while moving the pub",
			cause: error,
		}
	}

	logger.info({ msg: "move", pub, config })

	return {
		success: true,
		report: "Pub moved",
		data: {},
	}
})
