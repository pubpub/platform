import { Globe2 } from "lucide-react"
import * as z from "zod"

import { Action } from "db/public"

import { defineAction } from "../types"

const schema = z.object({
	filter: z.string().describe("A filter expression that filters the Pubs to build"),
	pages: z.string().describe("A JSONata expression that maps a Pub to a page"),
})

export const action = defineAction({
	name: Action.buildSite,
	niceName: "Build Site",
	accepts: ["json", "pub"],
	superAdminOnly: true,
	experimental: true,
	config: {
		schema,
		interpolation: {
			exclude: ["filter", "pages"],
		},
	},
	description: "Build a site",
	icon: Globe2,
})
