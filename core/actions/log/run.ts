"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	logger.info({ msg: "log", pub, config, pubConfig });
	return {
		success: true,
		report: "Logged out data, check your console.",
		data: {},
	};
});
