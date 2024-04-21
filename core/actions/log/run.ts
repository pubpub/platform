"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, runParameters }) => {
	logger.info({
		msg: `Logging${runParameters?.text ? ` ${runParameters.text}` : ""}`,
		pub,
		config,
		runParameters,
	});

	return {
		success: true,
		report: `Logged out ${runParameters?.text || "some data"}, check your console.`,
		data: {},
	};
});
