import * as z from "zod"

import { jsonSchema } from "contracts"
import { Action } from "db/public"
import { Globe } from "ui/icon"

import { defineAction } from "../types"

const schema = z.object({
	url: z.string().url().describe("URL to send the request to"),
	method: z
		.enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
		.describe("HTTP method to use")
		.default("GET"),
	authToken: z
		.string()
		.describe('Will add an "Authorization: Bearer <token>" to the request headers')
		.optional(),
	response: z
		.enum(["json", "text", "binary"])
		.describe("Expected type to return")
		.default("json"),
	body: jsonSchema
		.optional()
		.describe("Body to send with the request. Only sent for non-GET requests."),
	outputMap: z
		.array(z.object({ pubField: z.string(), responseField: z.string() }))
		.optional()
		.describe("Map of JSON paths to pub fields"),
})

export const action = defineAction({
	name: Action.http,
	niceName: "HTTP Request",
	description: "Make an arbitrary HTTP request",
	accepts: ["json", "pub"],
	config: {
		schema,
	},
	icon: Globe,
	experimental: true,
})
