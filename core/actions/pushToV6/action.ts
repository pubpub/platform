import * as z from "zod";

import { FileText } from "ui/icon";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "pushToV6",
	config: {
		schema: z.object({
			communitySlug: z.string().describe("Community slug"),
			authToken: z.string().describe("PubPub v6 API auth token"),
		}),
	},
	description: "Sync a PubPub v7 pub to v6",
	params: { schema: z.object({}).optional() },
	pubFields: [corePubFields.title, corePubFields.content],
	icon: FileText,
});
