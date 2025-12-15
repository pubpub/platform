import "server-only"

import type { PubsId } from "db/public"
import type { FullAutomation } from "db/types"
import type { ButtonProps } from "ui/button"

import { Button } from "ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "ui/dropdown-menu"
import { ChevronDown, Play } from "ui/icon"
import { cn } from "utils"

import { AutomationRunForm } from "./AutomationRunForm"

export type PubsRunAutomationDropDownMenuProps = {
	automations: Omit<FullAutomation, "lastAutomationRun">[]
	pubId: PubsId
	testId?: string
	/* accessible text for the button */
	buttonText?: string
	iconOnly?: boolean
	canOverrideAutomationConditions: boolean
} & ButtonProps

export const PubsRunAutomationsDropDownMenu = async ({
	pubId,
	testId,
	iconOnly,
	buttonText,
	automations,
	canOverrideAutomationConditions,
	...buttonProps
}: PubsRunAutomationDropDownMenuProps) => {
	if (!automations.length) {
		return null
	}

	return (
		<DropdownMenu modal={true}>
			<DropdownMenuTrigger asChild>
				<Button
					className="flex items-center gap-x-2"
					variant="outline"
					size="sm"
					data-testid={testId}
					{...buttonProps}
				>
					<Play size="12" strokeWidth="1px" className="text-neutral-500" />
					<span className={cn({ "sr-only": iconOnly })}>
						{buttonText ?? "Run automation"}
					</span>
					{iconOnly ? null : <ChevronDown size="14" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{automations.map((automation) => (
					<AutomationRunForm
						key={automation.id}
						pubId={pubId}
						automation={automation}
						canOverrideAutomationConditions={canOverrideAutomationConditions}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
