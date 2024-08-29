import * as z from "zod";

import { MoveHorizontal } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: "move",
	config: {
		schema: z.object({
			stage: z.string().uuid().describe("Destination stage"),
		}),
		fieldConfig: {
			stage: {
				fieldType: "custom",
			},
		},
	},
	description: "Move a pub to a different stage",
	params: { schema: z.object({}).optional() },
	icon: MoveHorizontal,
});
