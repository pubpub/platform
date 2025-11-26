"use client"

import type { PubTypesId } from "db/public"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "ui/button"
import { cn } from "utils"

import { usePubSearch } from "~/app/c/[communitySlug]/pubs/PubSearchProvider"

export const PubTypeLabel = ({
	pubType,
	canFilter,
}: {
	pubType: {
		id: PubTypesId
		name: string
	}
	canFilter?: boolean
}) => {
	if (canFilter) {
		return <FilterablePubTypeLabel pubType={pubType} />
	}

	return (
		<Button
			variant="outline"
			className="h-[22px] rounded-sm border-gray-300 bg-gray-100 px-[.35rem] font-semibold text-xs shadow-none"
		>
			{pubType.name}
		</Button>
	)
}

export const FilterablePubTypeLabel = ({
	pubType,
}: {
	pubType: {
		id: PubTypesId
		name: string
	}
}) => {
	const { inputValues, setFilters } = usePubSearch()

	const [expanded, setExpanded] = useState(false)

	const currentPubTypes = inputValues.pubTypes ?? []

	const isSelected = currentPubTypes.includes(pubType.id)

	return (
		<Button
			variant="outline"
			className={cn(
				"h-[22px] gap-0 rounded-sm border-gray-300 bg-gray-100 px-[.35rem] font-semibold text-xs shadow-none"
			)}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
			onFocus={() => setExpanded(true)}
			onBlur={() => setExpanded(false)}
			aria-label={`${pubType.name} ${isSelected ? "remove from" : "add to"} filter`}
			onClick={() => {
				setFilters((old) => ({
					...old,
					pubTypes: isSelected
						? (old.pubTypes.filter((id) => id !== pubType.id) as PubTypesId[])
						: [...old.pubTypes, pubType.id],
				}))
			}}
		>
			<span className="transition-transform duration-200">{pubType.name}</span>
			<div
				className={cn("w-0 overflow-hidden transition-all duration-300 ease-in-out", {
					"ml-1 w-[14px]": expanded,
				})}
			>
				<div
					className={`text-muted-foreground transition-opacity duration-500 ease-in-out hover:text-foreground ${
						expanded ? "opacity-100" : "opacity-0"
					}`}
				>
					{isSelected ? <X size={14} /> : <Plus size={14} />}
				</div>
			</div>
		</Button>
	)
}
