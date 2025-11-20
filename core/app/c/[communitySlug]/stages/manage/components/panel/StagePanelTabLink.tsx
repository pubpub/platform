"use client"

import { parseAsString, useQueryState } from "nuqs"

import { TabsTrigger } from "ui/tabs"

import { capitalize } from "~/lib/string"

export function TabLink({ tab }: { tab: string }) {
	const [, setTabQueryState] = useQueryState("tab", parseAsString)

	return (
		<TabsTrigger
			value={tab}
			onClick={() => {
				setTabQueryState(tab)
			}}
		>
			{capitalize(tab)}
		</TabsTrigger>
	)
}
