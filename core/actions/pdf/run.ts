"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, runParameters }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	logger.info({ msg: "pdf generated", pub, config, runParameters });
	return {
		error: "Wow, an error",
	};
});
