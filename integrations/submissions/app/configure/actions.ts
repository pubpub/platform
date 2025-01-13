"use server"

import { headers } from "next/headers"
import { captureException, withServerActionInstrumentation } from "@sentry/nextjs"

import { setInstanceConfig } from "~/lib/instance"

export const configure = async (instanceId: string, pubTypeId: string) => {
	return withServerActionInstrumentation(
		"configure",
		{
			headers: headers(),
		},
		async () => {
			try {
				await setInstanceConfig(instanceId, { pubTypeId })
				return { success: true }
			} catch (error) {
				captureException(error)
				return { error: error.message }
			}
		}
	)
}
