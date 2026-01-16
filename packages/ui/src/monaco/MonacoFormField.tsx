"use client"

import type { FieldValues, Path } from "react-hook-form"
import type { MonacoFormFieldProps, ValidationResult } from "./types"

import * as React from "react"
import { AlertTriangle, Check, X } from "lucide-react"

import { Button } from "../button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip"
import { MonacoEditor } from "./MonacoEditor"

export function MonacoFormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
	field,
	allowInvalid = false,
	showValidationStatus = true,
	onValidate,
	...props
}: MonacoFormFieldProps<TFieldValues, TName>) {
	const [validation, setValidation] = React.useState<ValidationResult>({
		valid: true,
		errors: [],
	})
	const [overridden, setOverridden] = React.useState(false)

	const handleValidate = React.useCallback(
		(result: ValidationResult) => {
			setValidation(result)
			onValidate?.(result)
		},
		[onValidate]
	)

	const handleChange = React.useCallback(
		(newValue: string) => {
			setOverridden(false)
			field.onChange(newValue)
		},
		[field]
	)

	const handleOverride = React.useCallback(() => {
		setOverridden(true)
	}, [])

	return (
		<div className="relative">
			<MonacoEditor
				{...props}
				value={field.value ?? ""}
				onChange={handleChange}
				onValidate={handleValidate}
				aria-labelledby={props["aria-labelledby"]}
			/>
			{showValidationStatus && (
				<div className="absolute right-2 bottom-2 z-10 flex items-center gap-1">
					{validation.valid ? (
						<div className="flex items-center gap-1 rounded-sm bg-emerald-100 px-1.5 py-0.5 text-emerald-700 text-xs dark:bg-emerald-900/50 dark:text-emerald-300">
							<Check size={12} />
							<span>Valid</span>
						</div>
					) : overridden ? (
						<div className="flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-amber-700 text-xs dark:bg-amber-900/50 dark:text-amber-300">
							<AlertTriangle size={12} />
							<span>Overridden</span>
						</div>
					) : (
						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex cursor-help items-center gap-1 rounded-sm bg-red-100 px-1.5 py-0.5 text-red-700 text-xs dark:bg-red-900/50 dark:text-red-300">
										<X size={12} />
										<span>Invalid</span>
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									<div className="space-y-1">
										{validation.errors.map((err, i) => (
											<div key={i} className="text-xs">
												Line {err.line}: {err.message}
											</div>
										))}
									</div>
								</TooltipContent>
							</Tooltip>
							{allowInvalid && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-5 px-1 text-xs"
									onClick={handleOverride}
								>
									Override
								</Button>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
