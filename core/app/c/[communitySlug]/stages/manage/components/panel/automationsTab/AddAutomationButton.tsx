"use client"

import { parseAsString, useQueryState } from "nuqs"

import { Button } from "ui/button"
import { Plus } from "ui/icon"

export function AddAutomationButton() {
	const [, setAutomationId] = useQueryState("automation-id", parseAsString)

	const handleClick = () => {
		setAutomationId("new")
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			data-testid="add-automation-button"
			className="m-0 h-6 p-0 text-neutral-700 hover:bg-transparent hover:text-neutral-900"
			onClick={handleClick}
		>
			<Plus size={16} /> Add automation
		</Button>
	)
}
