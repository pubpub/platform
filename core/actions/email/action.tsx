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

const schema = z.object({
	senderName: z
		.preprocess(emptyStringToUndefined, z.string().min(2).max(100).optional())
		.optional()
		.describe("This will appear in the 'From' header of the email"),
	replyTo: z
		.preprocess(emptyStringToUndefined, z.string().email().optional())
		.optional()
		.describe("Determines what the email recipient will see as the 'Reply-To' address"),
	recipientEmail: z
		.preprocess(emptyStringToUndefined, z.string().email().optional())
		.optional()
		.describe(
			"The email address of the recipient(s). Either this or 'Recipient Member' must be set."
		),
	recipientMember: z
		.string()
		.uuid()
		.describe(
			"Someone who is a member of the community. Either this or 'Recipient Email' must be set."
		)
		.optional(),
	subject: stringWithTokens()
		.max(500)
		.describe(
			"The subject of the email. Tokens can be used to dynamically insert values from the pub or config."
		),
	body: markdown()
		.min(0)
		.describe(
			"The body of the email. Markdown is supported. Tokens can be used to dynamically insert values from the pub or config."
		),
});

export const action = defineAction({
	accepts: ["pub"],
	name: Action.email,
	config: {
		schema,
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
		schema,
		// dependencies: [
		// 	{
		// 		sourceField: "recipientMember",
		// 		targetField: "recipientEmail",
		// 		when: (recipientMember) => Boolean(recipientMember),
		// 		type: DependencyType.DISABLES,
		// 	},
		// ],
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
