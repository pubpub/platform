import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { z } from "zod";

import { Action } from "db/public";

import { defineAction } from "../types";

const sharedSchema = z.object({
	docUrl: z.string().url().describe("Document URL|The URL of the Google Doc to import"),
	outputField: z.string().describe("Output Field|Where to store the Google Doc's content"),
});

export const action = defineAction({
	name: Action.googleDriveImport,
	description: "Import a Google Doc.",
	icon: SiGoogledrive,
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
