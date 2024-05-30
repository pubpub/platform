import * as z from "zod";

import { FileText } from "ui/icon";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "pdf",
	config: z.object({
		margin: z.number().optional().describe("Page margin in pixels"),
	}),
	description: "Generate a PDF from a pub",
	params: z
		.object({
			margin: z.number().optional().describe("Page margin in pixels"),
		})
		.optional(),
	pubFields: [corePubFields.title],
	icon: FileText,
});

// export { run } from "./run";
