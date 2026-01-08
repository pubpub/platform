"use client"

import type { AutomationsId } from "db/public"

import { Button } from "ui/button"
import { Plus } from "ui/icon"

import { useAutomationId } from "../usePanelQueryParams"

export function AddAutomationButton() {
	const { setAutomationId } = useAutomationId()

	const handleClick = () => {
		setAutomationId("new" as AutomationsId)
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			data-testid="add-automation-button"
			className="m-0 h-6 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
			onClick={handleClick}
		>
			<Plus size={16} /> Add automation
		</Button>
	)
}
