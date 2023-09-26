"use server";

import { findInstance } from "~/lib/instance";
import { client } from "~/lib/pubpub";

export const evaluate = async (
	instanceId: string,
	pubId: string,
	title: string,
	description: string
) => {
	const instance = await findInstance(instanceId);
	if (instance === undefined) {
		return { error: "Instance not configured" };
	}
	try {
		const pub = await client.createPub(instanceId, {
			values: {
				'unjournal/title': `Evaluation of "${title}"`,
				'unjournal/description': description,
			},
			pubTypeId: instance.pubTypeId,
			parentId: pubId,
		});
		return pub;
	} catch (error) {
		return { error: error.message };
	}
};
