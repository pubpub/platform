"use client"

import type { AutomationsId } from "db/public"

import { parseAsString, useQueryState } from "nuqs"

export function useAutomationId() {
	const [automationId, setAutomationId] = useQueryState(
		"automation-id",
		parseAsString.withOptions({
			shallow: true,
		})
	)

	return {
		automationId: automationId as AutomationsId | null,
		setAutomationId: setAutomationId as (automationId: AutomationsId | null) => void,
	}
}
