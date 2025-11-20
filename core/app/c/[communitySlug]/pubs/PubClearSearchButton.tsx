"use client"

import { X } from "lucide-react"

import { Button } from "ui/button"

import { usePubSearch } from "./PubSearchProvider"

export const PubClearSearchButton = ({ className }: { className?: string }) => {
	const { setQuery, setFilters } = usePubSearch()
	return (
		<Button
			variant="ghost"
			size="sm"
			className={className}
			onClick={() => {
				setQuery("")
				setFilters((old) => ({
					...old,
					pubTypes: [],
					stages: [],
					filters: [],
				}))
			}}
		>
			<X size={16} />
			Clear filters
		</Button>
	)
}
