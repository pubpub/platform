"use client"

import type { StageManageTab } from "~/lib/links"

import { TabsTrigger } from "ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { capitalize } from "~/lib/string"
import { useAutomationId, usePanelTab } from "./usePanelQueryParams"

export function StageTabLink({
	tab,
	children,
}: {
	tab: StageManageTab
	children?: React.ReactNode
}) {
	const { setTab } = usePanelTab()
	const { setAutomationId } = useAutomationId()

	const handleClick = (tab: string) => {
		setTab(tab as StageManageTab)
		setAutomationId(null)
	}

	return (
		<TabLink tab={tab} onClick={handleClick}>
			{children}
		</TabLink>
	)
}

export function TabLink({
	tab,
	onClick,
	children,
}: {
	tab: string
	onClick?: (tab: string) => void
	children?: React.ReactNode
}) {
	const handleClick = () => {
		onClick?.(tab)
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
						{children ? (
							<>
								{children}
								<span className="sr-only">{capitalize(tab)}</span>
							</>
						) : (
							capitalize(tab)
						)}
					</div>
				</TooltipTrigger>
			</TabsTrigger>
			<TooltipContent>{capitalize(tab)}</TooltipContent>
		</Tooltip>
	)
}
