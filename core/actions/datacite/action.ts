import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: Action.datacite,
	config: {
		schema: z.object({}),
	},
	description: "Deposit a pub's metadata to DataCite and grant it a DOI",
	params: {
		schema: z.object({}).optional(),
	},
	icon: Globe,
	superAdminOnly: true,
});
