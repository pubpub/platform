"use server";

import type { StagesId } from "db/public";
import { logger } from "logger";

import type { action } from "./action";
import { isUniqueConstraintError } from "~/kysely/errors";
import { movePub } from "~/lib/server/stages";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config }) => {
	const stageToMoveTo = config.stage;

	try {
		await movePub(pub.id, stageToMoveTo as StagesId).execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				success: true,
				report: `Pub was already in stage ${stageToMoveTo}`,
				data: {},
			};
		}
		logger.error({ msg: "move", error });
		return {
			title: "Failed to move pub",
			error: "An error occured while moving the pub",
			cause: error,
		};
	}

	logger.info({ msg: "move", pub, config, stageToMoveTo });

	return {
		success: true,
		report: "Pub moved",
		data: {},
	};
});
