import * as z from "zod";

import { Mail } from "ui/icon";

import { markdown, stringWithTokens } from "../_lib/zodTypes";
import { defineAction } from "../types";
import { EmailToken } from "./tokens";

export const action = defineAction({
	name: "email",
	config: {
		schema: z.object({
			recipient: z.string().uuid().describe("Recipient"),
			subject: stringWithTokens().max(500).describe("Email subject"),
			body: markdown().min(0).describe("Email body"),
		}),
		fieldConfig: {
			recipient: {
				fieldType: "custom",
			},
		},
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
				subject: stringWithTokens()
					.max(500)
					.describe("Email subject|Overrides the subject specified in the action config.")
					.optional(),
				body: markdown()
					.min(0)
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
	icon: Mail,
	tokens: {
		subject: {
			[EmailToken.Value]: {
				description: "Insert a value from the pub.",
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
		},
		body: {
			[EmailToken.Value]: {
				description: "Insert a value from the pub.",
			},
			[EmailToken.AssigneeName]: {
				description: "The full name of the email sender.",
			},
			[EmailToken.AssigneeFirstName]: {
				description: "The first name of the email sender.",
			},
			[EmailToken.AssigneeLastName]: {
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
