"use client"

import type { FieldType } from "./PathSelector"
import type { Operator } from "./types"

import React from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"

// all available operators
const ALL_OPERATORS = [
	{ value: "=", label: "=", types: ["string", "number", "date", "boolean", "unknown"] },
	{ value: "!=", label: "!=", types: ["string", "number", "date", "boolean", "unknown"] },
	{ value: ">", label: ">", types: ["number", "date"] },
	{ value: ">=", label: ">=", types: ["number", "date"] },
	{ value: "<", label: "<", types: ["number", "date"] },
	{ value: "<=", label: "<=", types: ["number", "date"] },
	{ value: "in", label: "in", types: ["string", "number", "unknown"] },
	{ value: "contains", label: "contains", types: ["string", "array", "unknown"] },
	{ value: "startsWith", label: "starts with", types: ["string"] },
	{ value: "endsWith", label: "ends with", types: ["string"] },
	{
		value: "exists",
		label: "exists",
		types: ["string", "number", "date", "boolean", "array", "object", "unknown"],
	},
] as const

interface OperatorSelectorProps {
	value: Operator
	onChange: (value: Operator) => void
	fieldType: FieldType
	disabled?: boolean
}

export function OperatorSelector({ value, onChange, fieldType, disabled }: OperatorSelectorProps) {
	const availableOperators = ALL_OPERATORS.filter(
		(op) => op.types.includes(fieldType) || fieldType === "unknown"
	)

	// if current value is not in available operators, default to first one
	const currentOp = availableOperators.find((op) => op.value === value)
	if (!currentOp && availableOperators.length > 0) {
		// auto-select first available operator
		onChange(availableOperators[0].value as Operator)
	}

	return (
		<Select value={value} onValueChange={(v) => onChange(v as Operator)} disabled={disabled}>
			<SelectTrigger className="h-8! w-[110px] text-xs">
				<SelectValue placeholder="Operator" />
			</SelectTrigger>
			<SelectContent>
				{availableOperators.map((op) => (
					<SelectItem key={op.value} value={op.value} className="text-xs">
						{op.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
