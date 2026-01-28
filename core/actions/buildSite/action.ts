import { Globe2 } from "lucide-react"
import * as z from "zod"

import { Action } from "db/public"

import { defineAction } from "../types"

const schema = z.object({
	siteBaseUrl: z
		.string()
		.url()
		.optional()
		.describe(
			"Base URL where the site will be accessible (e.g., 'https://sites.example.com/{communitySlug}'). " +
				"The full URL will be: {siteBaseUrl}/{communitySlug}/{subpath}/"
		),
	subpath: z
		.string()
		.optional()
		.describe(
			"Subpath for deployment (e.g., 'journal-2024'). If not provided, uses the automation run ID. " +
				"Preview builds always use the automation run ID."
		),
	pages: z
		.array(
			z.object({
				filter: z
					.string()
					.describe("A filter expression that gets a list of Pubs to build"),
				slug: z.string().describe("A JSONata expression that returns a slugs for the page"),
				transform: z
					.string()
					.describe("A JSONata expression that returns the HTML content for the page"),
			})
		)
		.min(1)
		.max(10),
	outputMap: z
		.array(z.object({ pubField: z.string(), responseField: z.string() }))
		.optional()
		.describe(
			"Map response fields to pub fields. Supports JSONPath ($.field) or JSONata expressions."
		),
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
