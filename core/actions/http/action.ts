import * as z from "zod";

import { DependencyType } from "ui/auto-form";
import { Globe } from "ui/icon";

import { defineAction } from "../types";
import { OutputMapFieldType } from "./outputMapFieldType";

export const action = defineAction({
	name: "http",
	config: z
		.object({
			url: z.string().describe("URL|URL to send the request to"),
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
			body: z
				.string()
				.optional()
				.describe(
					"Body|Body to send with the request. Only sent for non-GET requests.|textarea"
				),
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
	description: "Make an arbitrary HTTP request",
	runParameters: {
		schema: z
			.object({
				test: z.boolean().optional().describe("Test|Run the action in test mode"),
				url: z.string().optional().describe("URL|URL to send the request to"),
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
			.optional()
			.superRefine((value, ctx) => {
				if (value?.method === "GET" && value?.body) {
					return ctx.addIssue({
						message: "Body is not allowed for GET requests",
						code: "custom",
						path: ["body"],
					});
				}
			}),
		dependencies: [
			{
				sourceField: "method",
				targetField: "body",
				when: (method) => method === "GET" || !method,
				type: DependencyType.HIDES,
			},
		],
		fieldConfig: {
			outputMap: {
				fieldType: OutputMapFieldType,
			},
		},
	},
	pubFields: [],
	icon: Globe,
});
