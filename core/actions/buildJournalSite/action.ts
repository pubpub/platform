import { Book } from "lucide-react";
import * as z from "zod";

import { Action } from "db/public";
import { FileText } from "ui/icon";

import { fieldName } from "../_lib/zodTypes";
import { defineAction } from "../types";

const schema = z.object({
	token: z.string().describe("The token for the site builder"),
	articles: fieldName(),
	collections: fieldName(),
	mainColor: fieldName(),
	accentColor: fieldName(),
});

export const action = defineAction({
	name: Action.buildJournalSite,
	config: {
		schema,
	},
	description: "Build a journal site and receive a zip file",
	params: {
		schema: schema.partial(),
	},
	icon: Book,
});
