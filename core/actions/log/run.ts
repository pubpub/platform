"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ actionInstance, pub, config, args }) => {
	logger.info({
		msg: `Logging${args?.text ? ` ${args.text}` : ""}`,
		pub,
		config,
		args,
	});

	return {
		success: true,
		report: `Logged out ${args?.text || "some data"}, check your console.`,
		title: `Successfully ran ${actionInstance.name}`,
		data: {},
	};
});
