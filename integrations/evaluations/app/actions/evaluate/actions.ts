"use server";

import { client } from "~/lib/pubpub";

export const evaluate = async (
	instanceId: string,
	pubId: string,
	title: string,
	description: string
) => {
	try {
		const pub = await client.createPub(instanceId, {
			values: {
				Title: `Evaluation of ${title}`,
				Description: description,
			},
			pubTypeId: "81d18691-3ac4-42c1-b55b-d3b2c065b9ad",
			parentId: pubId,
		});
		return pub;
	} catch (error) {
		return { error: error.message };
	}
};
