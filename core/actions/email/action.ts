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

const emptyStringToUndefined = (arg: unknown) => {
	if (typeof arg === "string" && arg === "") {
		return undefined;
	} else {
		return arg;
	}
};

export const action = defineAction({
	accepts: ["pub"],
	name: Action.email,
	config: {
		schema: z.object({
			senderName: z
				.preprocess(emptyStringToUndefined, z.string().min(2).max(100).optional())
				.optional()
				.describe("Sender name"),
			replyTo: z
				.preprocess(emptyStringToUndefined, z.string().email().optional())
				.optional()
				.describe("Reply-to email address"),
			recipientEmail: z
				.preprocess(emptyStringToUndefined, z.string().email().optional())
				.optional()
				.describe("Recipient email address"),
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
		schema: z.object({
			senderName: z
				.preprocess(emptyStringToUndefined, z.string().min(2).max(100).optional())
				.optional()
				.describe("Sender name"),
			replyTo: z
				.preprocess(emptyStringToUndefined, z.string().email().optional())
				.optional()
				.describe("Reply-to email address"),
			recipientEmail: z
				.preprocess(emptyStringToUndefined, z.string().email().optional())
				.optional()
				.describe("Recipient email address"),
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
