import * as z from "zod";

import { Action } from "db/public";
import { Terminal } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.log,
	accepts: ["pub"],
	config: {
		schema: z.object({
			text: z
				.string()
				.default("")
				.describe("The string to log out in addition to the default parameters"),
			debounce: z.number().default(0).describe("Debounce time in milliseconds"),
		}),
	},
	description: "Log a pub to the console",
	params: {
		schema: z.object({
			debounce: z.number().default(0).describe("Debounce time in milliseconds"),
			text: z
				.string()
				.default("")
				.describe("The string to log out in addition to the default parameters"),
		}),
	},
	icon: Terminal,
	superAdminOnly: true,
});
