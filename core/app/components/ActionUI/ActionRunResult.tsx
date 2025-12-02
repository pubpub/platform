"use client"

import type { ActionRuns } from "db/public"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "ui/badge"
import { cn } from "utils"

import { isActionFailure, isActionSuccess } from "~/actions/results"

type Props = {
	actionRun: ActionRuns
	className?: string
}

export const ActionRunResult = ({ actionRun, className }: Props) => {
	const [showConfig, setShowConfig] = useState(false)
	const [showCause, setShowCause] = useState(false)

	const result = actionRun.result

	if (!result || typeof result !== "object") {
		return (
			<div className={cn("text-sm", className)}>
				<pre className="max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			</div>
		)
	}

	const isSuccess = isActionSuccess(result)
	const isFailure = isActionFailure(result)

	return (
		<div className={cn("space-y-2 text-sm", className)}>
			{isSuccess && (
				<>
					{result.title && (
						<div className="font-medium text-green-700">{result.title}</div>
					)}
					{result.report && (
						<div className="text-gray-700">
							{typeof result.report === "string" ? (
								<p>{result.report}</p>
							) : (
								result.report
							)}
						</div>
					)}
					{result.data &&
						typeof result.data === "object" &&
						Object.keys(result.data).length > 0 && (
							<details className="text-xs">
								<summary className="cursor-pointer text-gray-600">Data</summary>
								<pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono">
									{JSON.stringify(result.data, null, 2)}
								</pre>
							</details>
						)}
				</>
			)}

			{isFailure && (
				<>
					{result.title && (
						<div className="font-medium text-red-700 text-sm">{result.title}</div>
					)}
					<div className="text-red-600 text-xs">{result.error}</div>
					{result.cause && (
						<div>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault()
									setShowCause(!showCause)
								}}
								className="flex items-center gap-1 text-gray-600 text-xs hover:text-gray-900"
							>
								{showCause ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
								Show error details
							</button>
							{showCause && (
								<pre className="mt-1 max-h-40 overflow-auto rounded bg-red-50 p-2 font-mono text-red-800 text-xs">
									{typeof result.cause === "string"
										? result.cause
										: JSON.stringify(result.cause, null, 2)}
								</pre>
							)}
						</div>
					)}
				</>
			)}

			{!isSuccess && !isFailure && (
				<pre className="max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}

			{"config" in result && !!result.config && (
				<div>
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault()
							setShowConfig(!showConfig)
						}}
						className="flex items-center gap-1 text-gray-600 text-xs hover:text-gray-900"
					>
						{showConfig ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
						Configuration
					</button>
					{showConfig && (
						<pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 font-mono text-xs">
							{JSON.stringify(result.config, null, 2)}
						</pre>
					)}
				</div>
			)}
		</div>
	)
}

export const ActionRunStatusBadge = ({ status }: { status: ActionRuns["status"] }) => {
	switch (status) {
		case "success":
			return <Badge variant="default">success</Badge>
		case "failure":
			return <Badge variant="destructive">failure</Badge>
		case "scheduled":
			return (
				<Badge variant="default" className="bg-orange-500">
					scheduled
				</Badge>
			)
		default:
			return <Badge variant="outline">unknown</Badge>
	}
}
