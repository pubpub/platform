"use client"

import type { PubTypes, Stages } from "db/public"
import type { FieldType } from "./PathSelector"

import { cn } from "utils"

import { Input } from "../input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"

interface ValueSelectorProps {
	value: string
	onChange: (value: string) => void
	path: string
	operator: string
	fieldType: FieldType
	pubTypes?: PubTypes[]
	stages?: Stages[]
	disabled?: boolean
}

export function ValueSelector({
	value,
	onChange,
	path,
	operator,
	fieldType,
	pubTypes,
	stages,
	disabled,
}: ValueSelectorProps) {
	// show dropdown for pub type selection
	if (path === "$.pub.pubType.name" && operator === "=" && pubTypes && pubTypes.length > 0) {
		return (
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger className="h-8 min-w-[150px] text-xs">
					<SelectValue placeholder="Select pub type..." />
				</SelectTrigger>
				<SelectContent>
					{pubTypes.map((pt) => (
						<SelectItem key={pt.id} value={pt.name} className="text-xs">
							{pt.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	if (path === "$.pub.pubType.id" && operator === "=" && pubTypes && pubTypes.length > 0) {
		return (
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger className="h-8 min-w-[150px] text-xs">
					<SelectValue placeholder="Select pub type..." />
				</SelectTrigger>
				<SelectContent>
					{pubTypes.map((pt) => (
						<SelectItem key={pt.id} value={pt.id} className="text-xs">
							{pt.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	// show dropdown for stage selection
	if (path === "$.pub.stageId" && operator === "=" && stages && stages.length > 0) {
		return (
			<Select value={value} onValueChange={onChange} disabled={disabled}>
				<SelectTrigger className="h-8 min-w-[150px] text-xs">
					<SelectValue placeholder="Select stage..." />
				</SelectTrigger>
				<SelectContent>
					{stages.map((stage) => (
						<SelectItem key={stage.id} value={stage.id} className="text-xs">
							{stage.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	// default to text input
	return (
		<Input
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={
				fieldType === "number" ? "0" : fieldType === "date" ? "2024-01-01" : "value"
			}
			className={cn("h-8 min-w-[150px] text-xs", fieldType === "number" && "font-mono")}
			type={fieldType === "number" ? "number" : "text"}
			disabled={disabled}
		/>
	)
}
