import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.datacite,
	config: {
		schema: z.object({
			doi: z.string().optional(),
			doiPrefix: z.string().optional(),
			doiSuffix: z.string().optional(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.date(),
			creator: z.string(),
			creatorName: z.string(),
		}),
		fieldConfig: {
			doi: {
				allowedSchemas: true,
			},
			doiSuffix: {
				allowedSchemas: true,
			},
			url: {
				allowedSchemas: true,
			},
			publisher: {
				allowedSchemas: true,
			},
			publicationDate: {
				allowedSchemas: true,
			},
			creator: {
				allowedSchemas: true,
			},
			creatorName: {
				allowedSchemas: true,
			},
		},
	},
	params: {
		schema: z.object({
			doi: z.string().optional(),
			doiPrefix: z.string().optional(),
			doiSuffix: z.string().optional(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.date(),
			author: z.string(),
			authorName: z.string(),
		}),
		fieldConfig: {
			doi: {
				allowedSchemas: true,
			},
			doiSuffix: {
				allowedSchemas: true,
			},
			url: {
				allowedSchemas: true,
			},
			publisher: {
				allowedSchemas: true,
			},
			publicationDate: {
				allowedSchemas: true,
			},
			author: {
				allowedSchemas: true,
			},
			authorName: {
				allowedSchemas: true,
			},
		},
	},
	description: "Deposit a pub to DataCite",
	icon: Globe,
});
