import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { z } from "zod";

import { Action } from "db/public";

import { defineAction } from "../types";

const sharedSchema = z.object({
	folderUrl: z
		.string()
		.url()
		.regex(
			/^https:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]+$/,
			"The URL must be a valid Google Drive folder URL like https://drive.google.com/drive/folders/<id>"
		)
		.describe("The URL of the Google Drive folder to import"),
});

export const action = defineAction({
	name: Action.googleDriveImport,
	accepts: ["pub"],
	description: "Import a Google Drive folder.",
	icon: SiGoogledrive,
	config: {
		schema: sharedSchema,
	},
	experimental: true,
	superAdminOnly: true,
});
