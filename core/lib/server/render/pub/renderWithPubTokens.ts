/**
 * Tokens to be substituted in the context of a pub.
 */
export enum RenderWithPubToken {
	Value = "value",
	Link = "link",
	RecipientName = "recipientname",
	RecipientFirstName = "recipientfirstname",
	RecipientLastName = "recipientlastname",
}

export const renderWithPubTokens = {
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
	[RenderWithPubToken.Link]: {
		description: "Insert a link.",
	},
}
