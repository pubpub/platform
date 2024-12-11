import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.datacite,
	config: {
		schema: z.object({
			doi: z.string(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.date(),
			author: z.string(),
			authorFirstName: z.string(),
			authorLastName: z.string(),
		}),
		fieldConfig: {
			doi: {
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
			authorFirstName: {
				allowedSchemas: true,
			},
			authorLastName: {
				allowedSchemas: true,
			},
		},
	},
	params: {
		schema: z.object({
			doi: z.string(),
			url: z.string(),
			publisher: z.string(),
			publicationDate: z.date(),
			author: z.string(),
			authorFirstName: z.string(),
			authorLastName: z.string(),
		}),
		fieldConfig: {
			doi: {
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
			authorFirstName: {
				allowedSchemas: true,
			},
			authorLastName: {
				allowedSchemas: true,
			},
		},
	},
	description: "Deposit a pub to DataCite",
	icon: Globe,
});
