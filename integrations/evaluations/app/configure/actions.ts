"use server";

import { setInstanceConfig } from "~/lib/instance";
import { InstanceConfig } from "~/lib/types";

export const configure = (instanceId: string, instanceConfig: Partial<InstanceConfig>) => {
	try {
		return setInstanceConfig(instanceId, instanceConfig);
	} catch (error) {
		return { error: error.message };
	}
};
