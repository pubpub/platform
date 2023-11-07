"use server";

import { InstanceConfig, setInstanceConfig } from "~/lib/instance";

export const configure = (instanceId: string, instanceConfig: InstanceConfig) => {
	try {
		return setInstanceConfig(instanceId, instanceConfig);
	} catch (error) {
		return { error: error.message };
	}
};
