"use client"

import type { PubTypes, PubTypesId, StagesId } from "db/public"
import type React from "react"
import type { PubSearchParams } from "./pubQuery"

import { memo, type SetStateAction } from "react"
import { ArrowUpDownIcon, PlusCircle, SortAsc, SortDesc } from "lucide-react"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { MultiSelect } from "ui/multi-select"

import { SearchBar, SearchContent } from "~/app/components/Search/SearchBar"
import { entries } from "~/lib/mapping"
import { usePubSearch } from "./PubSearchProvider"

export type StageFilters = {
	id: StagesId
	name: string
}[]

export type TypeFilters = {
	id: PubTypesId
	name: string
}[]

export type PubSearchFilters = {
	default: {
		stage?: StageFilters
		type?: TypeFilters
	}
	available: {
		stage: Promise<StageFilters>
		type: Promise<TypeFilters>
	}
}

export type PubSearchProps = React.PropsWithChildren<{
	// filters: PubSearchFilters;
}>

const sorts = {
	updatedAt: "Updated",
	createdAt: "Created",
	title: "Title",
}

export const PubSearch = (props: PubSearchProps) => {
	const {
		queryParams,
		inputValues,
		setQuery,
		setFilters,
		stale,
		availableStages,
		availablePubTypes,
	} = usePubSearch()

	return (
		<div className="flex flex-col gap-4">
			<SearchBar
				value={inputValues.query}
				onChange={setQuery}
				placeholder="Search by pub title..."
			>
				<PubTypesFilter
					availablePubTypes={availablePubTypes}
					defaultPubTypes={queryParams.pubTypes.map((type) => type.id)}
					setFilters={setFilters}
					selectedPubTypes={inputValues.pubTypes}
				/>
				<StagesFilter
					availableStages={availableStages}
					defaultStages={queryParams.stages.map((stage) => stage.id)}
					setFilters={setFilters}
					currentStages={inputValues.stages}
				/>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto h-9" size="sm">
							{queryParams.sort ? (
								queryParams.sort[0]?.desc ? (
									<SortDesc />
								) : (
									<SortAsc />
								)
							) : (
								<ArrowUpDownIcon />
							)}
							{queryParams.sort
								? sorts[queryParams.sort[0]?.id as keyof typeof sorts]
								: "Sort"}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						{entries(sorts).map(([key, label]) => (
							<DropdownMenuItem
								key={key}
								onClick={() =>
									setFilters((old) => ({
										...old,
										sort: [{ id: key, desc: !queryParams.sort[0]?.desc }],
									}))
								}
							>
								{label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SearchBar>
			<SearchContent stale={stale}>{props.children}</SearchContent>
		</div>
	)
}

export const PubTypesFilter = memo(
	({
		availablePubTypes,
		defaultPubTypes,
		setFilters,
		selectedPubTypes,
	}: {
		availablePubTypes: PubTypes[]
		defaultPubTypes: PubTypesId[]
		setFilters: (filters: SetStateAction<PubSearchParams>) => void
		selectedPubTypes: PubTypesId[]
	}) => {
		return (
			<MultiSelect
				options={availablePubTypes?.map((type) => ({
					label: type.name,
					value: type.id,
				}))}
				defaultValue={defaultPubTypes}
				onValueChange={(items) =>
					setFilters((old) => ({ ...old, pubTypes: items as PubTypesId[] }))
				}
				showClearAll
				value={selectedPubTypes}
				asChild
			>
				<Button variant="outline" className="h-9" size="sm">
					<PlusCircle size={16} />
					Type
					{selectedPubTypes?.length ? (
						<span className="ml-1 text-muted-foreground text-xs">
							{selectedPubTypes.length}
						</span>
					) : null}
				</Button>
			</MultiSelect>
		)
	}
)

export const StagesFilter = memo(
	({
		availableStages,
		defaultStages,
		setFilters,
		currentStages,
	}: {
		availableStages: StageFilters
		defaultStages: StagesId[]
		setFilters: (filters: SetStateAction<PubSearchParams>) => void
		currentStages: StagesId[]
	}) => {
		return (
			<MultiSelect
				options={availableStages.map((stage) => ({
					label: stage.name,
					value: stage.id,
				}))}
				defaultValue={defaultStages}
				onValueChange={(items) =>
					setFilters((old) => ({ ...old, stages: items as StagesId[] }))
				}
				value={currentStages}
				showClearAll
				asChild
			>
				<Button variant="outline" className="h-9" size="sm">
					<PlusCircle size={16} />
					Stage
					{currentStages?.length ? (
						<span className="ml-1 text-muted-foreground text-xs">
							{currentStages.length}
						</span>
					) : null}
				</Button>
			</MultiSelect>
		)
	}
)
