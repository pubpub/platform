"use server";

import { assert } from "utils";
import { updateInstance } from "~/lib/instance";

export const configure = (form: FormData) => {
	const instanceId = form.get("instance-id");
	const pubTypeId = form.get("pub-type-id");
	assert(typeof instanceId === "string");
	assert(typeof pubTypeId === "string");
	try {
		return updateInstance(instanceId, { pubTypeId });
	} catch (error) {
		return { error: error.message };
	}
};
