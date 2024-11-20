"use server";

import { headers } from "next/headers";
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs";

import type { InstanceConfig } from "~/lib/types";
import { setInstanceConfig } from "~/lib/instance";

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
