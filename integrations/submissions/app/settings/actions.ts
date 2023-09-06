"use server";

import { updateInstance } from "~/lib/instance";

export const configure = async (instanceId: string, pubTypeId: string) => {
	try {
		await updateInstance(instanceId, { pubTypeId });
		return { message: "Instance configured!" };
	} catch (error) {
		return { message: "Failed to configure instance", cause: error.message };
	}
};
