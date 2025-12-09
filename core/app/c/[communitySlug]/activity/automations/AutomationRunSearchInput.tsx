"use client"

import type { AutomationsId, StagesId } from "db/public"

import { MultiSelect } from "ui/multi-select"
import { Separator } from "ui/separator"
import { cn } from "utils"

import { FilterPopover } from "~/app/components/Search/FilterPopover"
import { SearchBar } from "~/app/components/Search/SearchBar"
import { SortDropdown } from "~/app/components/Search/SortDropdown"
import { entries } from "~/lib/mapping"
import { useAutomationRunSearch } from "./AutomationRunSearchProvider"

const statuses = {
	success: "Success",
	failure: "Failure",
	partial: "Partial",
	scheduled: "Scheduled",
}

export type AutomationRunSearchProps = React.PropsWithChildren

export const AutomationRunSearch = (props: AutomationRunSearchProps) => {
	const {
		queryParams,
		inputValues,
		setQuery,
		setFilters,
		stale,
		availableAutomations,
		availableStages,
		availableActions,
	} = useAutomationRunSearch()

	const activeFilterCount =
		queryParams.automations.length +
		queryParams.statuses.length +
		queryParams.stages.length +
		queryParams.actions.length

	return (
		<div className="flex flex-col gap-4">
			<SearchBar
				value={inputValues.query}
				onChange={setQuery}
				placeholder="Search by automation name..."
				actions={
					<>
						<FilterPopover activeFilterCount={activeFilterCount}>
							<div>
								<h4 className="mb-2 font-medium text-sm">Automation</h4>
								<MultiSelect
									options={availableAutomations?.map((automation) => ({
										label: automation.name,
										value: automation.id,
									}))}
									defaultValue={queryParams.automations.map(
										(automation) => automation.id
									)}
									onValueChange={(items) =>
										setFilters((old) => ({
											...old,
											automations: items as AutomationsId[],
										}))
									}
									showClearAll
									value={inputValues.automations}
									placeholder="Select automations..."
								/>
							</div>
							<Separator />
							<div>
								<h4 className="mb-2 font-medium text-sm">Status</h4>
								<MultiSelect
									options={entries(statuses).map(([key, label]) => ({
										label,
										value: key,
									}))}
									defaultValue={queryParams.statuses}
									onValueChange={(items) =>
										setFilters((old) => ({ ...old, statuses: items }))
									}
									value={inputValues.statuses}
									showClearAll
									placeholder="Select statuses..."
								/>
							</div>
							<Separator />
							<div>
								<h4 className="mb-2 font-medium text-sm">Stage</h4>
								<MultiSelect
									options={availableStages?.map((stage) => ({
										label: stage.name,
										value: stage.id,
									}))}
									defaultValue={queryParams.stages.map((stage) => stage.id)}
									onValueChange={(items) =>
										setFilters((old) => ({
											...old,
											stages: items as StagesId[],
										}))
									}
									value={inputValues.stages}
									showClearAll
									placeholder="Select stages..."
								/>
							</div>
							<Separator />
							<div>
								<h4 className="mb-2 font-medium text-sm">Action</h4>
								<MultiSelect
									options={availableActions?.map((action) => ({
										label: action.name,
										value: action.id,
									}))}
									defaultValue={queryParams.actions.map((action) => action.id)}
									onValueChange={(items) =>
										setFilters((old) => ({ ...old, actions: items }))
									}
									value={inputValues.actions}
									showClearAll
									placeholder="Select actions..."
								/>
							</div>
						</FilterPopover>

						<SortDropdown
							options={[{ id: "createdAt", label: "Created" }]}
							currentSort={queryParams.sort[0]}
							onSortChange={(id, desc) =>
								setFilters((old) => {
									id

									return { ...old, sort: [{ id, desc }] }
								})
							}
						/>
					</>
				}
			/>
			<div
				className={cn(
					stale &&
						'opacity-50 transition-opacity duration-200 [&_[data-testid*="automation-run-card"]]:animate-pulse',
					"m-4 mt-1"
				)}
			>
				{props.children}
			</div>
		</div>
	)
}
