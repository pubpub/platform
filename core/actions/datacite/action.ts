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
			title: z.string(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.coerce.date(),
			contributor: z.string(),
			contributorPerson: z.string(),
			contributorPersonName: z.string(),
			contributorPersonORCID: z.string().optional(),
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
			contributor: {
				allowedSchemas: true,
			},
			contributorPerson: {
				allowedSchemas: true,
			},
			contributorPersonName: {
				allowedSchemas: true,
			},
			contributorPersonORCID: {
				allowedSchemas: true,
			},
		},
	},
	params: {
		schema: z.object({
			doi: z.string().optional(),
			doiPrefix: z.string().optional(),
			doiSuffix: z.string().optional(),
			title: z.string(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.coerce.date(),
			contributor: z.string(),
			contributorPerson: z.string(),
			contributorPersonName: z.string(),
			contributorPersonORCID: z.string().optional(),
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
			contributor: {
				allowedSchemas: true,
			},
			contributorPerson: {
				allowedSchemas: true,
			},
			contributorPersonName: {
				allowedSchemas: true,
			},
			contributorPersonORCID: {
				allowedSchemas: true,
			},
		},
	},
	description: "Deposit a pub to DataCite",
	icon: Globe,
	experimental: true,
	superAdminOnly: true,
});
