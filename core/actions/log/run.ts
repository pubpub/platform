"use server";

import { logger } from "logger";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ actionInstance, pub, config, args }) => {
	const text = args?.text ?? config.text;
	const debounce = args?.debounce ?? config.debounce;

	logger.info({
		msg: `Logging${text ? ` ${text}` : ""}`,
		pub,
		debounce,
		config,
		args,
	});

	return {
		success: true,
		report: `Logged out ${text || "some data"}, check your console.`,
		title: `Successfully ran ${actionInstance.name}`,
		data: {},
	};
});
