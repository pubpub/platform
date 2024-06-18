import { SendEmailRequestBody } from "contracts";

import { integrationClient } from "../clients";
import { defineJob } from "../defineJob";
import { InstanceJobPayload } from "../types";

export const sendEmail = defineJob(
	integrationClient,
	async (payload: InstanceJobPayload<SendEmailRequestBody>, logger, job, client) => {
		const { instanceId, body } = payload;
		logger.info({ msg: `Sending email` });
		const info = await client.sendEmail(instanceId, body);
		logger.info({ msg: `Sent email`, info });
	}
);
