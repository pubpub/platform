"use client"

import { Button } from "ui/button"

import { useAutomationRunSearch } from "./AutomationRunSearchProvider"

export const AutomationRunClearSearchButton = () => {
	const { setFilters } = useAutomationRunSearch()

	return (
		<Button
			variant="outline"
			onClick={() => {
				setFilters({
					query: "",
					automations: [],
					statuses: [],
					filters: [],
					page: 1,
					stages: [],
					actions: [],
					sort: [{ id: "createdAt", desc: true }],
					perPage: 25,
				})
			}}
		>
			Clear filters
		</Button>
	)
}
