"use client"

import type { PubTypes, Stages } from "db/public"
import type { PubField } from "../pubFields/PubFieldContext"

import * as React from "react"
import { useState } from "react"
import { ChevronRight, Code } from "lucide-react"

import { Button } from "../button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../dropdown-menu"
import { Input } from "../input"

export type FieldType = "string" | "number" | "date" | "boolean" | "array" | "object" | "unknown"

export interface PathOption {
	path: string
	label: string
	type: FieldType
	category: "builtin" | "pubType" | "stage" | "value" | "expression"
}

interface PathSelectorProps {
	value: string
	onChange: (value: string, fieldType: FieldType) => void
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	disabled?: boolean
}

function ValueBadge({ children }: { children: React.ReactNode }) {
	return (
		<span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-blue-700 text-xs lowercase dark:bg-blue-900/30 dark:text-blue-300">
			{children}
		</span>
	)
}

function getFieldTypeFromSchema(schemaName: string | null | undefined): FieldType {
	if (!schemaName) return "unknown"

	const lower = schemaName.toLowerCase()
	if (lower.includes("number") || lower.includes("integer")) return "number"
	if (lower.includes("date") || lower.includes("time")) return "date"
	if (lower.includes("boolean") || lower.includes("checkbox")) return "boolean"
	if (lower.includes("array") || lower.includes("select")) return "array"
	if (lower.includes("object") || lower.includes("json")) return "object"
	return "string"
}

function getDisplayLabel(path: string): string {
	if (path.startsWith("$.pub.values.")) {
		return path.replace("$.pub.values.", "")
	}
	if (path.startsWith("$.pub.pubType.")) {
		return `pubType.${path.replace("$.pub.pubType.", "")}`
	}
	if (path.startsWith("$.pub.")) {
		return path.replace("$.pub.", "")
	}
	if (path.startsWith("$.json.")) {
		return path.replace("$.json.", "json.")
	}
	return path
}

export function PathSelector({
	value,
	onChange,
	pubFields,
	pubTypes,
	stages,
	disabled,
}: PathSelectorProps) {
	const [isExpressionMode, setIsExpressionMode] = useState(false)
	const [expressionValue, setExpressionValue] = useState(value)

	// check if current value is a standard path we recognize
	const isStandardPath = value.startsWith("$.pub.") || value.startsWith("$.json.")

	const handleSelectPath = (path: string, fieldType: FieldType) => {
		setIsExpressionMode(false)
		onChange(path, fieldType)
	}

	const handleExpressionSubmit = () => {
		onChange(expressionValue, "unknown")
	}

	const handleExpressionMode = () => {
		setIsExpressionMode(true)
		setExpressionValue(value)
	}

	if (isExpressionMode) {
		return (
			<div className="flex items-center gap-1">
				<Input
					value={expressionValue}
					onChange={(e) => setExpressionValue(e.target.value)}
					onBlur={handleExpressionSubmit}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleExpressionSubmit()
						}
						if (e.key === "Escape") {
							setIsExpressionMode(false)
						}
					}}
					placeholder="$.pub.values.field"
					className="h-8 min-w-[180px] font-mono text-xs"
					autoFocus
					disabled={disabled}
				/>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setIsExpressionMode(false)}
					className="h-8 px-2 text-xs"
				>
					Cancel
				</Button>
			</div>
		)
	}

	const valueFields = pubFields
		? Object.values(pubFields)
				.filter((f) => !f.isArchived)
				.map((field) => {
					const shortSlug = field.slug.includes(":")
						? field.slug.split(":").pop()!
						: field.slug
					return {
						path: `$.pub.values.${shortSlug}`,
						label: field.name,
						slug: shortSlug,
						type: getFieldTypeFromSchema(field.schemaName),
					}
				})
		: []

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className="h-8 min-w-[180px] justify-between gap-2 px-2 text-left text-xs"
					disabled={disabled}
				>
					{value ? (
						isStandardPath ? (
							<ValueBadge>{getDisplayLabel(value)}</ValueBadge>
						) : (
							<span className="font-mono text-xs">{value}</span>
						)
					) : (
						<span className="text-muted-foreground">Select field...</span>
					)}
					<ChevronRight className="h-3 w-3 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel className="text-muted-foreground text-xs">
					Pub Fields
				</DropdownMenuLabel>

				{/* builtin pub fields */}
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="text-xs">Builtin</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.id", "string")}
							className="text-xs"
						>
							<ValueBadge>id</ValueBadge>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.title", "string")}
							className="text-xs"
						>
							<ValueBadge>title</ValueBadge>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.createdAt", "date")}
							className="text-xs"
						>
							<ValueBadge>createdAt</ValueBadge>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.updatedAt", "date")}
							className="text-xs"
						>
							<ValueBadge>updatedAt</ValueBadge>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{/* pub type */}
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="text-xs">Pub Type</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.pubType.name", "string")}
							className="text-xs"
						>
							<ValueBadge>pubType.name</ValueBadge>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => handleSelectPath("$.pub.pubType.id", "string")}
							className="text-xs"
						>
							<ValueBadge>pubType.id</ValueBadge>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>

				{/* stage */}
				<DropdownMenuItem
					onClick={() => handleSelectPath("$.pub.stageId", "string")}
					className="text-xs"
				>
					<ValueBadge>stageId</ValueBadge>
				</DropdownMenuItem>

				{/* custom values */}
				{valueFields.length > 0 && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="text-xs">Values</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
							{valueFields.map((field) => (
								<DropdownMenuItem
									key={field.path}
									onClick={() => handleSelectPath(field.path, field.type)}
									className="text-xs"
								>
									<div className="flex flex-col gap-0.5">
										<span>{field.label}</span>
										<ValueBadge>{field.slug}</ValueBadge>
									</div>
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}

				<DropdownMenuSeparator />

				<DropdownMenuLabel className="text-muted-foreground text-xs">
					JSON Context
				</DropdownMenuLabel>

				<DropdownMenuItem onClick={handleExpressionMode} className="text-xs">
					<Code className="mr-2 h-3 w-3" />
					Custom expression...
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
