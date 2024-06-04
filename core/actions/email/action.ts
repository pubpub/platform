import * as z from "zod";

import { Mail } from "ui/icon";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "email",
	config: z.object({
		email: z.string().email().describe("Email address"),
		subject: z.string().describe("Email subject"),
		body: z.string().min(0).max(1_000).describe("Email body||textarea"),
	}),
	description: "Send an email to one or more users",
	params: z
		.object({
			email: z
				.string()
				.email()
				.describe(
					"Email address|Overrides the email address specified in the action config."
				)
				.optional(),
			subject: z
				.string()
				.describe("Email subject|Overrides the subject specified in the action config.")
				.optional(),
			body: z
				.string()
				.min(0)
				.max(1_000)
				.describe("Email body|Overrides the body specified in the action config.|textarea")
				.optional(),
		})
		.optional(),
	pubFields: [corePubFields.title],
	icon: Mail,
});

// export { run } from "./run";
