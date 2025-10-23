import * as z from "zod";

import { Action } from "db/public";
import { Globe } from "ui/icon";

import { outputMap } from "../_lib/zodTypes";
import { defineAction } from "../types";

export const action = defineAction({
	name: Action.http,
	accepts: ["json", "pub"],
	config: {
		schema: z.object({
			url: z.string().url().describe("URL to send the request to"),
			method: z
				.enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
				.describe("HTTP method to use")
				.default("GET"),
			authToken: z
				.string()
				.optional()
				.describe('Will add an "Authorization: Bearer <token>" to the request headers'),
			response: z
				.enum(["json", "text", "binary"])
				.default("json")
				.describe("Expected type to return"),
			body: z
				.string()
				// this makes sure that the body is valid JSON
				.transform((str, ctx) => {
					if (!str) {
						return undefined;
					}
					try {
						// we just want to check if it can be parsed
						const parsed = JSON.parse(str);
						return str;
					} catch (e) {
						ctx.addIssue({ code: "custom", message: "Invalid JSON" });
						return z.NEVER;
					}
				})
				.optional()
				.describe("Body to send with the request. Only sent for non-GET requests."),
			outputMap: z
				.array(z.object({ pubField: z.string(), responseField: z.string() }))
				.optional()
				.describe("Map of JSON paths to pub fields"),
		}),
	},
	description: "Make an arbitrary HTTP request",
	params: {
		schema: z.object({
			test: z.boolean().optional().describe("Run the action in test mode"),
			url: z.string().url().optional().describe("URL to send the request to"),
			method: z
				.enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
				.describe("HTTP method to use")
				.default("GET"),
			response: z
				.enum(["json", "text", "binary"])
				.default("json")
				.describe("Expected type to return"),
			authToken: z
				.string()
				.optional()
				.describe('Will add an "Authorization: Bearer <token>" to the request headers'),
			body: z
				.string()
				.transform((str, ctx) => {
					if (!str) {
						return undefined;
					}
					try {
						// we just want to check if it can be parsed
						const parsed = JSON.parse(str);
						return str;
					} catch (e) {
						ctx.addIssue({ code: "custom", message: "Invalid JSON" });
						return z.NEVER;
					}
				})
				.optional()
				.describe("Body to send with the request. Only sent for non-GET requests."),
			outputMap: outputMap().optional().describe("Map of JSON paths to pub fields"),
		}),
	},
	icon: Globe,
	experimental: true,
});
