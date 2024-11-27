import { defineRun } from "../types";
import { action } from "./action";

export const run = defineRun<typeof action>(async ({ pub, config, args }) => {
	return {
		success: true,
		report: "Successfully imported",
		data: {},
	};
});
