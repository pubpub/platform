import * as z from "zod";

import { MoveHorizontal } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: "move",
	config: z.object({
		stage: z.string().describe("Destination stage"),
	}),
	description: "Move a pub to a different stage",
	params: z.object({}).optional(),
	pubFields: [],
	icon: MoveHorizontal,
});
