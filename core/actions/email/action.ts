import * as z from "zod";

import { Action } from "db/public";
import { DependencyType } from "ui/auto-form/dependencyType";
import { Mail } from "ui/icon";

import {
	RenderWithPubToken,
	renderWithPubTokens,
} from "~/lib/server/render/pub/renderWithPubTokens";
import { markdown, stringWithTokens } from "../_lib/zodTypes";
import { defineAction } from "../types";

export const action = defineAction({
	name: Action.email,
	config: {
		schema: z.object({
			recipientEmail: z.string().email().describe("Recipient email address").optional(),
			recipientMember: z.string().uuid().describe("Recipient member").optional(),
			subject: stringWithTokens().max(500).describe("Email subject"),
			body: markdown().min(0).describe("Email body"),
		}),
		fieldConfig: {
			recipientEmail: {
				allowedSchemas: true,
			},
			recipientMember: {
				fieldType: "custom",
			},
		},
		dependencies: [
			{
				sourceField: "recipientMember",
				targetField: "recipientEmail",
				when: (recipientMember) => Boolean(recipientMember),
				type: DependencyType.DISABLES,
			},
		],
	},
	description: "Send an email to one or more users",
	params: {
		schema: z
			.object({
				recipientEmail: z.string().email().describe("Recipient email address").optional(),
				recipientMember: z
					.string()
					.uuid()
					.describe(
						"Recipient Member|Overrides the recipient community member specified in the action config."
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
			recipientEmail: {
				allowedSchemas: true,
			},
			recipientMember: {
				fieldType: "custom",
			},
		},
		dependencies: [
			{
				sourceField: "recipientMember",
				targetField: "recipientEmail",
				when: (recipientMember) => Boolean(recipientMember),
				type: DependencyType.DISABLES,
			},
		],
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
		body: renderWithPubTokens,
	},
});
