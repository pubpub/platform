import dynamic from "next/dynamic";
import * as z from "zod";

import { DependencyType } from "ui/auto-form";
import { Globe } from "ui/icon";

import { defineAction } from "../types";

export const action = defineAction({
	name: "http",
	config: {
		schema: z
			.object({
				url: z.string().url().describe("URL|URL to send the request to"),
				method: z
					.enum(["GET", "POST", "PUT", "DELETE"])
					.optional()
					.describe("Method|HTTP method to use. Defaults to GET")
					.default("GET"),
				authToken: z
					.string()
					.optional()
					.describe(
						'Bearer token|Will get put as "Authorization: Bearer <token>" in the headers'
					),
				response: z
					.enum(["json", "text", "binary"])
					.default("json")
					.optional()
					.describe("Response|Expected type to return"),
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
					.describe(
						"Body|Body to send with the request. Only sent for non-GET requests."
					),
				outputMap: z
					.array(z.object({ pubField: z.string(), responseField: z.string() }))
					.optional()
					.describe("Output map|Map of JSON paths to pub fields"),
			})
			.superRefine((value, ctx) => {
				if (value?.method === "GET" && value?.body) {
					return ctx.addIssue({
						message: "Body is not allowed for GET requests",
						code: "custom",
						path: ["body"],
					});
				}
			}),
		fieldConfig: {
			outputMap: {
				fieldType: "custom",
			},
			body: {
				fieldType: "textarea",
				inputProps: {
					className: "font-mono text-gray-700",
				},
			},
		},
		dependencies: [
			{
				sourceField: "method",
				targetField: "body",
				when: (method) => method === "GET" || !method,
				type: DependencyType.HIDES,
			},
			{
				sourceField: "response",
				targetField: "outputMap",
				when: (response) => response !== "json",
				type: DependencyType.DISABLES,
			},
		],
	},
	description: "Make an arbitrary HTTP request",
	params: {
		schema: z
			.object({
				test: z.boolean().optional().describe("Test|Run the action in test mode"),
				url: z.string().url().optional().describe("URL|URL to send the request to"),
				method: z
					.enum(["GET", "POST", "PUT", "DELETE"])
					.describe("Method|HTTP method to use. Defaults to GET")
					.default("GET")
					.optional(),
				authToken: z
					.string()
					.optional()
					.describe(
						'Bearer token|Will get put as "Authorization: Bearer <token>" in the headers'
					),
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
					.describe(
						"Body|Body to send with the request. Only sent for non-GET requests."
					),
				outputMap: z
					.array(z.object({ pubField: z.string(), responseField: z.string() }))
					.optional()
					.describe("Output map|Map of JSON paths to pub fields"),
			})
			.superRefine((value, ctx) => {
				if (value?.method === "GET" && value?.body) {
					return ctx.addIssue({
						message: "Body is not allowed for GET requests",
						code: "custom",
						path: ["body"],
					});
				}
			})
			.optional(),

		dependencies: [
			{
				sourceField: "method",
				targetField: "body",
				when: (method) => method === "GET" || !method,
				type: DependencyType.HIDES,
			},
		],
		fieldConfig: {
			body: {
				fieldType: "textarea",
				inputProps: {
					className: "font-mono text-gray-700",
				},
			},
			outputMap: {
				fieldType: "custom",
			},
		},
	},
	pubFields: [],
	icon: Globe,
	experimental: true,
});
