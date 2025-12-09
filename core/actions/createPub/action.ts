import { Edit } from "lucide-react"
import z from "zod"

import { Action } from "db/public"

import { defineAction } from "../types"

export const action = defineAction({
	name: Action.createPub,
	icon: Edit,
	accepts: ["pub", "json"],
	description: "Create a new pub",
	config: {
		schema: z.object({
			stage: z.string().uuid(),
			formSlug: z.string(),
			pubValues: z.record(z.unknown()),
		}),
	},
})
