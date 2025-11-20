"use client"

import type { StagesId } from "db/public"

import { useCallback, useState } from "react"
import { ChevronDown, FlagTriangleRightIcon, Plus, X } from "lucide-react"

import { Button } from "ui/button"
import { cn } from "utils"

import { usePubSearch } from "~/app/c/[communitySlug]/pubs/PubSearchProvider"
import { BasicMoveButton } from "~/app/c/[communitySlug]/stages/components/BasicMoveButton"

interface Props extends React.ComponentPropsWithoutRef<"button"> {
	withDropdown?: boolean
	stage: {
		id: StagesId
		name: string
	}
	canFilter?: boolean
	ref?: React.RefObject<HTMLButtonElement>
}

export const StageMoveButton = ({ stage, canFilter, withDropdown, ...props }: Props) => {
	if (canFilter) {
		return <FilterableStageMoveButton stage={stage} withDropdown={withDropdown} {...props} />
	}

	return <BasicMoveButton {...props} name={stage.name} withDropdown={withDropdown} />
}

export const FilterableStageMoveButton = ({ stage, withDropdown, className, ...props }: Props) => {
	const { inputValues, setFilters } = usePubSearch()
	const [expanded, setExpanded] = useState(false)

	const currentStages = inputValues.stages ?? []

	const isSelected = currentStages.includes(stage.id)

	const toggleStage = useCallback(() => {
		setFilters((old) => ({
			...old,
			stages: isSelected
				? (old.stages.filter((id) => id !== stage.id) as StagesId[])
				: [...old.stages, stage.id],
		}))
	}, [isSelected, stage.id, setFilters])

	return (
		<Button
			{...props}
			variant="outline"
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
			// keyboard focus
			onFocus={() => setExpanded(true)}
			onBlur={() => setExpanded(false)}
			className={cn(
				className,
				"relative h-[22px] gap-0 rounded-full border-gray-300 px-[.35rem] font-semibold text-xs shadow-none",
				withDropdown ? "" : "pr-4"
			)}
		>
			<FlagTriangleRightIcon strokeWidth="1px" className="text-neutral-500" />
			{stage.name}
			{withDropdown && <ChevronDown strokeWidth="1px" />}
			<div
				className={cn("w-0 overflow-hidden transition-all duration-300 ease-in-out", {
					"ml-1 w-[14px]": expanded,
				})}
			/>

			<Button
				asChild
				variant="ghost"
				onClick={toggleStage}
				size="icon"
				className={`-translate-y-1/2 absolute top-1/2 right-1 z-10 h-4 w-4 rounded-full text-muted-foreground transition-opacity duration-500 ease-in-out hover:bg-gray-200 hover:text-foreground ${
					expanded ? "opacity-100" : "opacity-0"
				}`}
				aria-label={`${stage.name} ${isSelected ? "remove from" : "add to"} filter`}
				tabIndex={0}
				// ugh
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						toggleStage()
					}
				}}
			>
				<span>
					<span className="sr-only">
						{stage.name} {isSelected ? "remove from" : "add to"} filter
					</span>
					{isSelected ? (
						<X size={6} strokeWidth="1px" />
					) : (
						<Plus size={6} strokeWidth="1px" />
					)}
				</span>
			</Button>
		</Button>
	)
}
