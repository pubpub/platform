import * as z from "zod";

import { Mail } from "ui/icon";

import * as corePubFields from "../corePubFields";
import { defineAction } from "../types";

export const action = defineAction({
	name: "email",
	config: z.object({
		email: z.string().min(5).describe("Email address"),
		subject: z.string().describe("Email subject"),
		body: z.string().min(0).max(1_000).describe("Email body"),
	}),
	description: "Send an email to one or more users",
	pubConfig: z.object({}),
	pubFields: [corePubFields.title],
	icon: Mail,
});

// export { run } from "./run";
