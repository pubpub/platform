"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	logger.info({ msg: "email", pub, config, pubConfig });

	return {
		success: true as const,
		report: "Email sent",
		data: {},
	};
});
