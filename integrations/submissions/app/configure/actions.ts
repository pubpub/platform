"use server";

import { updateInstance } from "~/lib/instance";

export const configure = (instanceId: string, pubTypeId: string) => {
	try {
		// return { error: "We couldn't update the instance." };
		return updateInstance(instanceId, { pubTypeId });
	} catch (error) {
		return { error: error.message };
	}
};
