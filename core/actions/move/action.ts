import * as z from "zod";

import { Action } from "db/public";
import { MoveHorizontal } from "ui/icon";

import { stage } from "../_lib/zodTypes";
import { defineAction } from "../types";

export const action = defineAction({
	name: Action.move,
	config: {
		schema: z.object({
			stage: stage().describe("Destination stage"),
		}),
	},
	description: "Move a pub to a different stage",
	params: { schema: z.object({ stage: stage().describe("Destination stage") }) },
	icon: MoveHorizontal,
});
