import { SendEmailRequestBody } from "contracts"

import type { IntegrationClient } from "../clients"
import type { InstanceJobPayload } from "../types"
import { defineJob } from "../defineJob"

export const sendEmail = defineJob(
	async (
		client: IntegrationClient,
		payload: InstanceJobPayload<SendEmailRequestBody>,
		logger,
		job
	) => {
		const { instanceId, body } = payload
		logger.info({ msg: `Sending email` })
		const info = await client.sendEmail(instanceId, body)
		logger.info({ msg: `Sent email`, info })
	}
)
