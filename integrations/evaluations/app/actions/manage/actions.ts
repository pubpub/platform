"use server";

import { SuggestedMembersQuery } from "@pubpub/sdk";
import { client } from "~/lib/pubpub";

export const manage = async (
	instanceId: string,
	pubId: string,
	pubTitle: string,
	email: string,
	firstName: string,
	lastName: string
) => {
	try {
		const info = await client.sendEmail(instanceId, {
			to: {
				firstName,
				lastName,
				email,
			},
			subject: "You've been invited to review a submission on PubPub",
			message: `Hello {{user.firstName}} {{user.lastName}}! You've been invited to evaluate <a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pubTitle}</a> on PubPub.`,
			job: {
				key: `${instanceId}-${pubId}-invite-${email}`,
				runAt: new Date().toISOString(),
			},
		});
		return info;
	} catch (error) {
		return { error: error.message };
	}
};

export const suggest = async (instanceId: string, query: SuggestedMembersQuery) => {
	try {
		const suggestions = await client.getSuggestedMembers(instanceId, query);
		return suggestions;
	} catch (error) {
		return { error: error.message };
	}
};
