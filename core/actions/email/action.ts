import * as z from "zod";

import { Mail } from "ui/icon";

import { markdown } from "../_lib/zodTypes";
import { defineAction } from "../types";
import { EmailToken } from "./tokens";

export const action = defineAction({
	name: "email",
	config: {
		schema: z.object({
			recipient: z.string().uuid().describe("Recipient"),
			subject: z.string().describe("Email subject"),
			body: markdown().min(0).max(2_000).describe("Email body"),
		}),
	},
	description: "Send an email to one or more users",
	params: {
		schema: z
			.object({
				recipient: z
					.string()
					.uuid()
					.describe(
						"Recipient|Overrides the recipient user specified in the action config."
					)
					.optional(),
				subject: z
					.string()
					.describe("Email subject|Overrides the subject specified in the action config.")
					.optional(),
				body: markdown()
					.min(0)
					.max(1_000)
					.describe("Email body|Overrides the body specified in the action config.")
					.optional(),
			})
			.optional(),
		fieldConfig: {
			recipient: {
				fieldType: "custom",
			},
		},
	},
	pubFields: [],
	icon: Mail,
	tokens: {
		body: {
			[EmailToken.Value]: {
				description: "Insert a value from the pub.",
			},
			[EmailToken.SenderName]: {
				description: "The full name of the email sender.",
			},
			[EmailToken.SenderFirstName]: {
				description: "The first name of the email sender.",
			},
			[EmailToken.SenderLastName]: {
				description: "The last name of the email sender.",
			},
			[EmailToken.RecipientName]: {
				description: "The full name of the email recipient.",
			},
			[EmailToken.RecipientFirstName]: {
				description: "The first name of the email recipient.",
			},
			[EmailToken.RecipientLastName]: {
				description: "The last name of the email recipient.",
			},
			[EmailToken.Link]: {
				description: "Insert a link.",
			},
		},
	},
});
