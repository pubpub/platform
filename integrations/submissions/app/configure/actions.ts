"use server";

import { setInstanceConfig } from "~/lib/instance";

export const configure = (instanceId: string, pubTypeId: string) => {
	try {
		return setInstanceConfig(instanceId, { pubTypeId });
	} catch (error) {
		return { error: error.message };
	}
};
