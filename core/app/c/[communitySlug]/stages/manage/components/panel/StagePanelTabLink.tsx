"use client"

import type { StageManageTab } from "~/lib/links"

import { parseAsString, useQueryState } from "nuqs"

import { TabsTrigger } from "ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { capitalize } from "~/lib/string"
import { useAutomationId } from "./automationsTab/useAutomationId"

export function TabLink({ tab, children }: { tab: StageManageTab; children: React.ReactNode }) {
	const [, setTabQueryState] = useQueryState("tab", parseAsString)
	const { setAutomationId } = useAutomationId()

	const handleClick = () => {
		setTabQueryState(tab)
		setAutomationId(null)
	}

	return (
		<TabsTrigger value={tab} onClick={handleClick}>
			<Tooltip>
				<TooltipTrigger>
					<>
						{children}
						<span className="sr-only">{capitalize(tab)}</span>
					</>
				</TooltipTrigger>
				<TooltipContent>{capitalize(tab)}</TooltipContent>
			</Tooltip>
		</TabsTrigger>
	)
}
