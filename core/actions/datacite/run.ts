"use server";

import type { action } from "./action";
import { defineRun } from "../types";

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	return {
		data: {},
		success: true,
	};
});
