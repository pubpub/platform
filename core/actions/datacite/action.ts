import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.datacite,
	accepts: ["pub"],
	config: {
		schema: z.object({
			doi: z.string().optional(),
			doiPrefix: z.string().optional(),
			doiSuffix: z.string().optional(),
			title: z.string().default(""),
			url: z.string().default(""),
			publisher: z.string().default(""),
			publicationDate: z.coerce.date().default(new Date()),
			contributor: z.string().default(""),
			contributorPerson: z.string().default(""),
			contributorPersonName: z.string().default(""),
			contributorPersonORCID: z.string().optional(),
			bylineContributorFlag: z.boolean().optional(),
		}),
	},
	params: {
		schema: z.object({
			doi: z.string().optional(),
			doiPrefix: z.string().optional(),
			doiSuffix: z.string().optional(),
			title: z.string().default(""),
			url: z.string().default(""),
			publisher: z.string().default(""),
			publicationDate: z.coerce.date().default(new Date()),
			contributor: z.string().default(""),
			contributorPerson: z.string().default(""),
			contributorPersonName: z.string().default(""),
			contributorPersonORCID: z.string().optional(),
			bylineContributorFlag: z.boolean().optional(),
		}),
	},
	description: "Deposit a pub to DataCite",
	icon: Globe,
	experimental: true,
	superAdminOnly: true,
});
