"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(
	async ({ pub, config, runParameters: runParameters }) => {
		logger.info({ msg: "log", pub, config, runParameters });
		return {
			success: true,
			report: "Logged out data, check your console.",
			data: {},
		};
	}
);
