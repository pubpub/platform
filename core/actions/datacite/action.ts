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
			title: z.string().optional(),
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
			title: {
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
			title: z.string().optional(),
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
			title: {
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
	description: "Deposit a pub to DataCite",
	icon: Globe,
	experimental: true,
	superAdminOnly: true,
