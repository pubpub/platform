"use client"

import type { StageManageTab } from "~/lib/links"

import { parseAsString, useQueryState } from "nuqs"

import { TabsTrigger } from "ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip"

import { capitalize } from "~/lib/string"

export function TabLink({ tab, children }: { tab: StageManageTab; children: React.ReactNode }) {
	const [, setTabQueryState] = useQueryState("tab", parseAsString)

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TabsTrigger
					value={tab}
					onClick={() => {
						setTabQueryState(tab)
					}}
				>
					{children}
					<span className="sr-only">{capitalize(tab)}</span>
				</TabsTrigger>
			</TooltipTrigger>
			<TooltipContent>{capitalize(tab)}</TooltipContent>
		</Tooltip>
	)
}
