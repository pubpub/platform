"use client"

import type { PubTypesId, StagesId } from "db/public"
import type React from "react"

import { useRef } from "react"
import { ArrowUpDownIcon, PlusCircle, Search, SortAsc, SortDesc, X } from "lucide-react"

import { Button } from "ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu"
import { KeyboardShortcutPriority, useKeyboardShortcut, usePlatformModifierKey } from "ui/hooks"
import { Input } from "ui/input"
import { MultiSelect } from "ui/multi-select"
import { cn } from "utils"

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
	const inputRef = useRef<HTMLInputElement>(null)

	const { symbol, platform } = usePlatformModifierKey()
	useKeyboardShortcut(
		"Mod+k",
		() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		},
		{
			priority: KeyboardShortcutPriority.MEDIUM,
		}
	)

	const {
		queryParams,
		inputValues,
		setQuery,
		setFilters,
		stale,
		availableStages,
		availablePubTypes,
	} = usePubSearch()

	const handleClearInput = () => {
		setQuery("")
	}
	// determine if content is stale, in order to provide a visual feedback to the user

	return (
		<div className="flex flex-col gap-4">
			<div className="sticky top-0 z-20 mt-0 flex w-full items-center gap-x-2 border-b px-4 py-2">
				<div className="relative flex min-w-96 items-center gap-x-2">
					<Search
						className="-translate-y-1/2 absolute top-1/2 left-2 text-muted-foreground"
						size={16}
					/>
					<Input
						ref={inputRef}
						value={inputValues?.query}
						onChange={(e) => {
							setQuery(e.target.value)
						}}
						placeholder="Search updates as you type..."
						className={cn("pl-8 tracking-wide shadow-none", inputValues && "pr-8")}
					/>
					<span className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center font-mono text-gray-500 text-xs opacity-50 md:flex">
						{inputValues?.query && (
							<button
								onClick={handleClearInput}
								className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:right-16"
								type="button"
								aria-label="Clear search"
							>
								<X size={14} />
							</button>
						)}
						<span
							className={cn(
								"flex w-10 items-center justify-center gap-x-1 transition-opacity duration-200",
								{
									// hide until hydrated, otherwise you see flash of `Ctrl` -> `Cmd` on mac
									"opacity-0": platform === "unknown",
								}
							)}
						>
							<span className={cn({ "mt-0.5 text-lg": platform === "mac" })}>
								{symbol}
							</span>{" "}
							K
						</span>
					</span>
				</div>
				<MultiSelect
					options={availablePubTypes?.map((type) => ({
						label: type.name,
						value: type.id,
					}))}
					defaultValue={queryParams.pubTypes.map((type) => type.id)}
					onValueChange={(items) =>
						setFilters((old) => ({ ...old, pubTypes: items as PubTypesId[] }))
					}
					showClearAll
					value={inputValues.pubTypes}
					asChild
				>
					<Button variant="outline" size="sm">
						<PlusCircle size={16} />
						Type
						{queryParams.pubTypes?.length ? (
							<span className="ml-1 text-gray-500 text-xs">
								{queryParams.pubTypes.length}
							</span>
						) : null}
					</Button>
				</MultiSelect>
				<MultiSelect
					options={availableStages?.map((stage) => ({
						label: stage.name,
						value: stage.id,
					}))}
					defaultValue={queryParams.stages.map((stage) => stage.id)}
					onValueChange={(items) =>
						setFilters((old) => ({ ...old, stages: items as StagesId[] }))
					}
					value={inputValues.stages}
					showClearAll
					asChild
				>
					<Button variant="outline" size="sm">
						<PlusCircle size={16} />
						Stage
						{queryParams.stages?.length ? (
							<span className="ml-1 text-gray-500 text-xs">
								{queryParams.stages.length}
							</span>
						) : null}
					</Button>
				</MultiSelect>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="ml-auto">
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
			</div>
			<div
				className={cn(
					stale &&
						'opacity-50 transition-opacity duration-200 **:data-[testid*="pub-card"]:animate-pulse',
					"m-4 mt-1"
				)}
			>
				{props.children}
			</div>
		</div>
	)
}
