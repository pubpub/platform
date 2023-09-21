"use server";

import { client } from "~/lib/pubpub";

export const manage = async (instanceId: string, pubId: string, email: string, name: string) => {
	try {
		const pub = await client.getPub(instanceId, pubId);
		const info = await client.sendEmail(instanceId, {
			to: {
				name,
				email,
			},
			subject: "You've been invited to review a submission on PubPub",
			message: `Hello {{user.name}}! You've been invited to evaluate <a href="{{instance.actions.evaluate}}?instanceId={{instance.id}}&pubId=${pubId}&token={{user.token}}">${pub.values.Title}</a> on PubPub.`,
		});
		return info;
	} catch (error) {
		return { error: error.message };
	}
};
