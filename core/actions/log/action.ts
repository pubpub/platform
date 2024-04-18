import * as z from "zod";

import { Terminal } from "ui/icon";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "log",
	config: z.object({
		debounce: z.number().optional().describe("Debounce time in milliseconds."),
	}),
	description: "Log a pub to the console",
	runParameters: z
		.object({
			debounce: z.number().optional().describe("Debounce time in milliseconds."),
			text: z
				.string()
				.describe("The string to log out in addition to the default parameters")
				.optional(),
		})
		.optional(),
	pubFields: [corePubFields.title],
	icon: Terminal,
});
