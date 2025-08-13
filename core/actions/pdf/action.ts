import * as z from "zod";

import { Action } from "db/public";
import { FileText } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.pdf,
	config: {
		schema: z.object({
			margin: z.number().optional().describe("Page margin in pixels"),
		}),
	},
	description: "Generate a PDF from a pub",
	params: {
		schema: z.object({
			margin: z.number().optional().describe("Page margin in pixels"),
		}),
	},
	icon: FileText,
	superAdminOnly: true,
});
