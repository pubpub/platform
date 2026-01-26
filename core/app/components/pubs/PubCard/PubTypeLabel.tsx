"use client"

import type { PubTypesId } from "db/public"

import { useState } from "react"
import { Plus, X } from "lucide-react"

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
		<span className="flex h-5 min-w-10 items-center truncate rounded-sm bg-muted px-[0.35rem] font-normal text-[10px] text-muted-foreground shadow-none">
			{pubType.name}
		</span>
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
		<button
			className="flex h-5 items-center gap-0.5 rounded-sm bg-muted/50 px-[0.35rem] font-normal text-xs shadow-none"
			type="button"
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
		</button>
	)
}
