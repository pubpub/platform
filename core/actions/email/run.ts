"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	logger.info(pub);

	return {
		success: true,
		data: {},
	};
});
