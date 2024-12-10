import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.datacite,
	config: {
		schema: z.object({
			doi: z.string(),
			publisher: z.string(),
		}),
		fieldConfig: {
			doi: {
				allowedSchemas: true,
			},
			publisher: {
				allowedSchemas: true,
			},
		},
	},
	params: {
		schema: z.object({
			doi: z.string(),
			publisher: z.string(),
		}),
		fieldConfig: {
			doi: {
				allowedSchemas: true,
			},
			publisher: {
				allowedSchemas: true,
			},
		},
	},
	description: "Deposit a pub to DataCite",
	icon: Globe,
});
