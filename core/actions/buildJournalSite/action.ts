import { Book } from "lucide-react";
import * as z from "zod";

import { Action } from "db/public";

import { defineAction } from "../types";

const schema = z.object({
	siteUrl: z.string().url().describe("The URL of the site to build"),
});

export const action = defineAction({
	name: Action.buildJournalSite,
	accepts: ["pub"],
	superAdminOnly: true,
	experimental: true,
	config: {
		schema,
	},
	description: "Build a journal site and receive a zip file",
	icon: Book,
});
