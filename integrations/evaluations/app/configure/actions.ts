"use server";

import { headers } from "next/headers";
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";

import { setInstanceConfig } from "~/lib/instance";
import { InstanceConfig } from "~/lib/types";

export const configure = (instanceId: string, instanceConfig: InstanceConfig) => {
	return withServerActionInstrumentation(
		"configure",
		{
			headers: headers(),
		},
		async () => {
			try {
				return setInstanceConfig(instanceId, instanceConfig);
			} catch (error) {
				captureException(error);
				return { error: error.message };
			}
		}
	);
};
