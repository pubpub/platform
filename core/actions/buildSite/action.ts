import { Globe2 } from "lucide-react"
import * as z from "zod"

import { Action } from "db/public"

import { defineAction } from "../types"

const schema = z.object({
	pages: z
		.array(
			z.object({
				filter: z
					.string()
					.describe("A filter expression that gets a list of Pubs to build"),
				slug: z.string().describe("A JSONata expression that returns a slugs for the page"),
				transform: z.string().describe("A JSONata expression that returns the HTML content for the page"),
			})
		)
		.min(1)
		.max(10),
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
			// we will do manual interpolation for the filter and transform expressions
			exclude: ["pages"],
		},
	},
	description: "Build a site",
	icon: Globe2,
})
