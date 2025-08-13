import * as z from "zod";

import { Action } from "db/public";
import { FileText } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.pushToV6,
	config: {
		schema: z.object({
			communitySlug: z.string().describe("Community slug"),
			authToken: z.string().describe("PubPub v6 API auth token"),
			title: z.string().describe("Title of the Pub"),
			content: z.string().describe("Content of the Pub"),
			idField: z
				.string()
				.regex(/\w+:\w+/)
				.describe("Field on this pub to write to id to|ID Field"),
		}),
	},
	description: "Sync a PubPub Platform pub to v6",
	params: { schema: z.object({}) },
	icon: FileText,
	superAdminOnly: true,
});
