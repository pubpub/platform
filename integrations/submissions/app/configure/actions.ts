"use server";

import { setInstanceConfig } from "~/lib/instance";

export const configure = async (instanceId: string, pubTypeId: string) => {
	try {
		await setInstanceConfig(instanceId, { pubTypeId });
		return { success: true };
	} catch (error) {
		return { error: error.message };
	}
};
