import * as z from "zod";

import { FileText } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: "pushToV6",
	config: {
		schema: z.object({
			communitySlug: z.string().describe("Community slug"),
			authToken: z.string().describe("PubPub v6 API auth token"),
			title: z.string().describe("Title of the pub"),
			content: z.string().describe("Content of the pub"),
		}),
	},
	description: "Sync a PubPub v7 pub to v6",
	params: { schema: z.object({}).optional() },
	icon: FileText,
});
