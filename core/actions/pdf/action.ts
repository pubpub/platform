import * as z from "zod";

import { FileText } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: "pdf",
	config: {
		schema: z.object({
			margin: z.number().optional().describe("Page margin in pixels"),
		}),
	},
	description: "Generate a PDF from a pub",
	params: {
		schema: z
			.object({
				margin: z.number().optional().describe("Page margin in pixels"),
			})
			.optional(),
	},
	icon: FileText,
	superAdminOnly: true,
});
