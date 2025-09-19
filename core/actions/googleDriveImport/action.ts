import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { z } from "zod";

import { Action, CoreSchemaType } from "db/public";

import { defineAction } from "../types";

const sharedSchema = z.object({
	docUrl: z.string().url().describe("Document URL|The URL of the Google Doc to import"),
	outputField: z.string().describe("Output Field|Where to store the Google Doc's content"),
});

export const action = defineAction({
	name: Action.googleDriveImport,
	accepts: ["pub"],
	description: "Import a Google Doc.",
	icon: SiGoogledrive,
	config: {
		schema: sharedSchema,
		fieldConfig: {
			docUrl: {
				allowedSchemas: [CoreSchemaType.URL],
			},
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
	superAdminOnly: true,
});
