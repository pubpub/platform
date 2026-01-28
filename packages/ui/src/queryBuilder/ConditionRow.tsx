"use client"

import type { PubTypes, Stages } from "db/public"

import { useState } from "react"
import { X } from "lucide-react"

import { cn } from "utils"

import { Button } from "../button"
import type { PubField } from "../pubFields/PubFieldContext"
import { OperatorSelector } from "./OperatorSelector"
import { PathSelector, type FieldType } from "./PathSelector"
import type { Operator, VisualCondition } from "./types"
import { ValueSelector } from "./ValueSelector"

export interface ConditionRowProps {
	condition: VisualCondition
	onChange: (condition: VisualCondition) => void
	onRemove: () => void
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	disabled?: boolean
}

export function ConditionRow({
	condition,
	onChange,
	onRemove,
	pubFields,
	pubTypes,
	stages,
	disabled,
}: ConditionRowProps) {
	const [fieldType, setFieldType] = useState<FieldType>("unknown")

	const showValueInput = condition.operator !== "exists"

	const handlePathChange = (path: string, type: FieldType) => {
		setFieldType(type)
		onChange({ ...condition, path })
	}

	const handleOperatorChange = (operator: Operator) => {
		onChange({ ...condition, operator })
	}

	const handleValueChange = (value: string) => {
		onChange({ ...condition, value })
	}

	return (
		<div className="flex items-center gap-2">
			<PathSelector
				value={condition.path}
				onChange={handlePathChange}
				pubFields={pubFields}
				pubTypes={pubTypes}
				stages={stages}
				disabled={disabled}
			/>

			<OperatorSelector
				value={condition.operator}
				onChange={handleOperatorChange}
				fieldType={fieldType}
				disabled={disabled}
			/>

			{showValueInput && (
				<ValueSelector
					value={condition.value}
					onChange={handleValueChange}
					path={condition.path}
					operator={condition.operator}
					fieldType={fieldType}
					pubTypes={pubTypes}
					stages={stages}
					disabled={disabled}
				/>
			)}

			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={onRemove}
				disabled={disabled}
				className={cn("shrink-0 text-muted-foreground hover:text-destructive")}
			>
				<X className="h-4 w-4" />
			</Button>
		</div>
	)
}
