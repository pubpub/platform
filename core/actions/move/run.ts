"use server";

import type { StagesId } from "db/public";
import { logger } from "logger";

import type { action } from "./action";
import { isUniqueConstraintError } from "~/kysely/errors";
import { movePub } from "~/lib/server/stages";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config }) => {
	try {
		await movePub(pub.id, config.stage as StagesId).execute();
	} catch (error) {
		if (isUniqueConstraintError(error)) {
			return {
				success: true,
				report: `Pub was already in stage ${config.stage}`,
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

	logger.info({ msg: "move", pub, config });

	return {
		success: true,
		report: "Pub moved",
		data: {},
	};
});
