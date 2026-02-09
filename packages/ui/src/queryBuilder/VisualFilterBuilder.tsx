"use client"

import type { PubTypes, Stages } from "db/public"
import type { PubField } from "../pubFields/PubFieldContext"
import type { LogicalOperator, VisualCondition, VisualConditionGroup, VisualQuery } from "./types"

import * as React from "react"
import { Plus, X } from "lucide-react"

import { cn } from "utils"

import { Button } from "../button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"
import { ConditionRow } from "./ConditionRow"

function generateId(): string {
	return Math.random().toString(36).substring(2, 9)
}

interface ConditionGroupProps {
	group: VisualConditionGroup
	onChange: (group: VisualConditionGroup) => void
	onRemove?: () => void
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	depth?: number
	disabled?: boolean
}

function ConditionGroup({
	group,
	onChange,
	onRemove,
	pubFields,
	pubTypes,
	stages,
	depth = 0,
	disabled,
}: ConditionGroupProps) {
	const handleOperatorChange = (operator: LogicalOperator) => {
		onChange({ ...group, operator })
	}

	const handleConditionChange = (index: number, condition: VisualCondition) => {
		const newConditions = [...group.conditions]
		newConditions[index] = condition
		onChange({ ...group, conditions: newConditions })
	}

	const handleGroupChange = (index: number, subGroup: VisualConditionGroup) => {
		const newConditions = [...group.conditions]
		newConditions[index] = subGroup
		onChange({ ...group, conditions: newConditions })
	}

	const handleRemove = (index: number) => {
		const newConditions = group.conditions.filter((_, i) => i !== index)
		onChange({ ...group, conditions: newConditions })
	}

	const handleAddCondition = () => {
		const newCondition: VisualCondition = {
			id: generateId(),
			path: "",
			operator: "=",
			value: "",
		}
		onChange({ ...group, conditions: [...group.conditions, newCondition] })
	}

	const handleAddGroup = () => {
		const newGroup: VisualConditionGroup = {
			id: generateId(),
			type: "group",
			operator: "and",
			conditions: [],
		}
		onChange({ ...group, conditions: [...group.conditions, newGroup] })
	}

	const isRoot = depth === 0

	return (
		<div
			className={cn(
				"space-y-2",
				!isRoot && "rounded-md border border-border bg-muted/30 p-3"
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					{!isRoot && <span className="text-muted-foreground text-xs">Match</span>}
					<Select
						value={group.operator}
						onValueChange={(v) => handleOperatorChange(v as LogicalOperator)}
						disabled={disabled}
					>
						<SelectTrigger className="h-7 w-[70px] text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="and" className="text-xs">
								AND
							</SelectItem>
							<SelectItem value="or" className="text-xs">
								OR
							</SelectItem>
						</SelectContent>
					</Select>
					{!isRoot && (
						<span className="text-muted-foreground text-xs">of the following</span>
					)}
				</div>
				{!isRoot && onRemove && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onRemove}
						disabled={disabled}
						className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
					>
						<X className="h-3 w-3" />
					</Button>
				)}
			</div>

			<div className="space-y-2">
				{group.conditions.map((item, index) => {
					if ("type" in item && item.type === "group") {
						return (
							<ConditionGroup
								key={item.id}
								group={item}
								onChange={(g) => handleGroupChange(index, g)}
								onRemove={() => handleRemove(index)}
								pubFields={pubFields}
								pubTypes={pubTypes}
								stages={stages}
								depth={depth + 1}
								disabled={disabled}
							/>
						)
					}
					return (
						<ConditionRow
							key={item.id}
							condition={item as VisualCondition}
							onChange={(c) => handleConditionChange(index, c)}
							onRemove={() => handleRemove(index)}
							pubFields={pubFields}
							pubTypes={pubTypes}
							stages={stages}
							disabled={disabled}
						/>
					)
				})}
			</div>

			<div className="flex gap-2 pt-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleAddCondition}
					disabled={disabled}
					className="h-7 text-muted-foreground text-xs"
				>
					<Plus className="mr-1 h-3 w-3" />
					Add condition
				</Button>
				{depth < 2 && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleAddGroup}
						disabled={disabled}
						className="h-7 text-muted-foreground text-xs"
					>
						<Plus className="mr-1 h-3 w-3" />
						Add group
					</Button>
				)}
			</div>
		</div>
	)
}

export interface VisualFilterBuilderProps {
	query: VisualQuery
	onChange: (query: VisualQuery) => void
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	disabled?: boolean
}

export function VisualFilterBuilder({
	query,
	onChange,
	pubFields,
	pubTypes,
	stages,
	disabled,
}: VisualFilterBuilderProps) {
	return (
		<ConditionGroup
			group={query}
			onChange={onChange}
			pubFields={pubFields}
			pubTypes={pubTypes}
			stages={stages}
			disabled={disabled}
		/>
	)
}
