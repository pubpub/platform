"use client"

import type { QueryBuilderProps, QueryMode } from "./types"

import React from "react"
import { Code2, Layers } from "lucide-react"

import { cn } from "utils"

import { Button } from "../button"
import { MonacoEditor } from "../monaco/MonacoEditor"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../tooltip"
import { useQueryBuilder } from "./useQueryBuilder"
import { VisualFilterBuilder } from "./VisualFilterBuilder"

export function QueryBuilder({
	value,
	onChange,
	pubFields,
	pubTypes,
	stages,
	defaultMode = "visual",
	theme = "dark",
	className,
	placeholder,
	disabled,
}: QueryBuilderProps) {
	const {
		mode,
		setMode,
		codeValue,
		setCodeValue,
		visualQuery,
		setVisualQuery,
		canUseVisualMode,
	} = useQueryBuilder({
		value,
		onChange,
		defaultMode,
	})

	const handleModeChange = (newMode: QueryMode) => {
		if (newMode === "visual" && !canUseVisualMode) {
			return
		}
		setMode(newMode)
	}

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-center justify-end gap-1">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant={mode === "visual" ? "secondary" : "ghost"}
								size="sm"
								onClick={() => handleModeChange("visual")}
								disabled={disabled || !canUseVisualMode}
								className="h-7 gap-1 px-2"
							>
								<Layers className="h-3.5 w-3.5" />
								<span className="text-xs">Visual</span>
							</Button>
						</TooltipTrigger>
						{!canUseVisualMode && (
							<TooltipContent>
								<p>Expression is too complex for visual editing</p>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>

				<Button
					type="button"
					variant={mode === "code" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => handleModeChange("code")}
					disabled={disabled}
					className="h-7 gap-1 px-2"
				>
					<Code2 className="h-3.5 w-3.5" />
					<span className="text-xs">Code</span>
				</Button>
			</div>

			{mode === "visual" ? (
				<div className="rounded-md border border-border bg-card p-3">
					<VisualFilterBuilder
						query={visualQuery}
						onChange={setVisualQuery}
						pubFields={pubFields}
						pubTypes={pubTypes}
						stages={stages}
						disabled={disabled}
					/>
				</div>
			) : (
				<MonacoEditor
					value={codeValue}
					onChange={(v) => setCodeValue(v ?? "")}
					language="jsonata"
					theme={theme}
					height="120px"
					options={{
						minimap: { enabled: false },
						lineNumbers: "off",
						folding: false,
						scrollBeyondLastLine: false,
						wordWrap: "on",
						placeholder: placeholder,
					}}
				/>
			)}
		</div>
	)
}
