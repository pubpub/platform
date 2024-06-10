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
					.optional()
					.describe(
						"Body|Body to send with the request. Only sent for non-GET requests.|textarea"
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
		context: z.object({
			pubFields: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
		}),
		fieldConfig: {
			outputMap: {
				fieldType: "custom",
				//dynamic(() => import("./config-component"), { ssr: false }),
				description: "AAAAA",
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
				type: DependencyType.HIDES,
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
					.optional()
					.describe(
						"Body|Body to send with the request. Only sent for non-GET requests.|textarea"
					),
				outputMap: z
					.record(z.string().optional())
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
		// fieldConfig: {
		// 	outputMap: {
		// 		fieldType: dynamic(() =>
		// 			import("./outputMapFieldType").then((m) => m.OutputMapFieldType)
		// 		),
		// 	},
		// },
	},
	pubFields: [],
	icon: Globe,
});
