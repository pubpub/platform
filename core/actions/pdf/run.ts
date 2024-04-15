"use server";

import { logger } from "logger";

import type { action } from "./action.tsx";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, pubConfig }) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	logger.info({ msg: "pdf generated", pub, config, pubConfig });
	return {
		error: "Wow, an error",
	};
});
