import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { z } from "zod";

import { Action } from "db/public";

import { fieldName } from "../_lib/zodTypes";
import { defineAction } from "../types";

const sharedSchema = z.object({
	docUrl: z.string().url().describe("The URL of the Google Doc to import"),
	outputField: fieldName().describe("Where to store the Google Doc's content"),
});

export const action = defineAction({
	name: Action.googleDriveImport,
	accepts: ["pub"],
	description: "Import a Google Doc.",
	icon: SiGoogledrive,
	config: {
		schema: sharedSchema,
	},
	params: {
		schema: sharedSchema.partial(),
	},
	experimental: true,
	superAdminOnly: true,
});
