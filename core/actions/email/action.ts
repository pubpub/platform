import * as z from "zod";

import { Mail } from "ui/icon";

import { RenderWithPubToken } from "~/lib/server/render/pub/renderWithPubUtils";
import { markdown, stringWithTokens } from "../_lib/zodTypes";
import { defineAction } from "../types";

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
			[RenderWithPubToken.Value]: {
				description: "Insert a value from the pub.",
			},
			[RenderWithPubToken.RecipientName]: {
				description: "The full name of the email recipient.",
			},
			[RenderWithPubToken.RecipientFirstName]: {
				description: "The first name of the email recipient.",
			},
			[RenderWithPubToken.RecipientLastName]: {
				description: "The last name of the email recipient.",
			},
		},
		body: {
			[RenderWithPubToken.Value]: {
				description: "Insert a value from the pub.",
			},
			[RenderWithPubToken.AssigneeName]: {
				description: "The full name of the email sender.",
			},
			[RenderWithPubToken.AssigneeFirstName]: {
				description: "The first name of the email sender.",
			},
			[RenderWithPubToken.AssigneeLastName]: {
				description: "The last name of the email sender.",
			},
			[RenderWithPubToken.RecipientName]: {
				description: "The full name of the email recipient.",
			},
			[RenderWithPubToken.RecipientFirstName]: {
				description: "The first name of the email recipient.",
			},
			[RenderWithPubToken.RecipientLastName]: {
				description: "The last name of the email recipient.",
			},
			[RenderWithPubToken.Link]: {
				description: "Insert a link.",
			},
		},
	},
});
