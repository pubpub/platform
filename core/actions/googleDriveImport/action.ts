import { z } from "zod";

import { Action } from "db/public";
import { GoogleDrive } from "ui/icon";

import { defineAction } from "../types";

const sharedSchema = z.object({
	docId: z.string().describe("Document ID|The ID of the Google Doc to import"),
	outputField: z
		.string()
		.optional()
		.describe("Output Field|Where to store the Google Doc's content"),
});

export const action = defineAction({
	name: Action.googleDriveImport,
	description: "Import a Google Doc.",
	icon: GoogleDrive,
	config: {
		schema: sharedSchema,
		fieldConfig: {
			outputField: {
				fieldType: "custom",
			},
		},
	},
	params: {
		schema: sharedSchema.partial(),
		fieldConfig: {
			outputField: {
				fieldType: "custom",
			},
		},
	},
	experimental: true,
});
