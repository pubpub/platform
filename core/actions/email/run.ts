"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, runParameters }) => {
	logger.info({ msg: "email", pub, config, runParameters });

	return {
		success: true,
		report: "Email sent",
		data: {},
	};
});
