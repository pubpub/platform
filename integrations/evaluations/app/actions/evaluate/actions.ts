"use server";

import { JSONType } from "ajv";
import { findInstance } from "~/lib/instance";
import { client } from "~/lib/pubpub";

export const evaluate = async (
	instanceId: string,
	pubId: string,
	values: Record<string, JSONType>
) => {
	const instance = await findInstance(instanceId);
	if (instance === undefined) {
		return { error: "Instance not configured" };
	}
	try {
		const pub = await client.createPub(instanceId, {
			pubTypeId: instance.pubTypeId,
			parentId: pubId,
			values: values,
		});
		return pub;
	} catch (error) {
		return { error: error.message };
	}
};
