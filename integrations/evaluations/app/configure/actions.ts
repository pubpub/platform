"use server";

import { setInstanceConfig } from "~/lib/instance";

export const configure = (
	instanceId: string,
	pubTypeId: string,
	template: { subject: string; message: string }
) => {
	try {
		// return { error: "We couldn't update the instance." };
		return setInstanceConfig(instanceId, { pubTypeId, template });
	} catch (error) {
		return { error: error.message };
	}
};
