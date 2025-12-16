"use client"

import type { StageManageTab } from "~/lib/links"

import { TabsTrigger } from "ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { capitalize } from "~/lib/string"
import { useAutomationId, usePanelTab } from "./usePanelQueryParams"

export function TabLink({ tab, children }: { tab: StageManageTab; children: React.ReactNode }) {
	const { setTab } = usePanelTab()
	const { setAutomationId } = useAutomationId()

	const handleClick = () => {
		setTab(tab)
		setAutomationId(null)
	}

	return (
		<Tooltip>
			<TabsTrigger
				className="data-[state=inactive]:border-none"
				value={tab}
				onClick={handleClick}
				asChild
			>
				<TooltipTrigger>
					<div>
						{children}
						<span className="sr-only">{capitalize(tab)}</span>
					</div>
				</TooltipTrigger>
			</TabsTrigger>
			<TooltipContent>{capitalize(tab)}</TooltipContent>
		</Tooltip>
	)
}
