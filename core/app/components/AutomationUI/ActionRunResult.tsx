"use client"

import type { ActionRuns } from "db/public"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { cn } from "utils"

import { isActionFailure, isActionSuccess } from "~/actions/results"

type Props = {
	actionRun: ActionRuns
	className?: string
}

export const ActionRunResult = ({ actionRun, className }: Props) => {
	const [showConfig, setShowConfig] = useState(false)
	const [showCause, setShowCause] = useState(false)
	const [showData, setShowData] = useState(false)

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
		<div className={cn("space-y-3 rounded-md bg-gray-50 p-3", className)}>
			{isSuccess && (
				<div className="space-y-2">
					{result.title && (
						<div className="font-medium text-green-700 text-sm">{result.title}</div>
					)}
					{result.report && (
						<div className="text-gray-700 text-sm">
							{typeof result.report === "string" ? <p>{result.report}</p> : null}
						</div>
					)}
					{!!result.data &&
						typeof result.data === "object" &&
						Object.keys(result.data).length > 0 && (
							<Collapsible open={showData} onOpenChange={setShowData}>
								<CollapsibleTrigger asChild>
									<button
										type="button"
										className="flex items-center gap-1 rounded px-2 py-1 text-gray-600 text-xs hover:bg-gray-200"
									>
										{showData ? (
											<ChevronDown size={12} />
										) : (
											<ChevronRight size={12} />
										)}
										View data
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<pre className="mt-2 max-h-40 overflow-auto rounded border bg-white p-2 font-mono text-xs">
										{JSON.stringify(result.data, null, 2)}
									</pre>
								</CollapsibleContent>
							</Collapsible>
						)}
				</div>
			)}

			{isFailure && (
				<div className="space-y-2">
					{result.title && (
						<div className="font-medium text-red-700 text-sm">{result.title}</div>
					)}
					<div className="text-red-700 text-sm">{result.error}</div>
					{!!result.cause && (
						<Collapsible open={showCause} onOpenChange={setShowCause}>
							<CollapsibleTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-1 rounded px-2 py-1 text-gray-600 text-xs hover:bg-gray-200"
								>
									{showCause ? (
										<ChevronDown size={12} />
									) : (
										<ChevronRight size={12} />
									)}
									Error details
								</button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<pre className="mt-2 max-h-40 overflow-auto rounded border border-red-200 bg-red-50 p-2 font-mono text-red-800 text-xs">
									{typeof result.cause === "string"
										? result.cause
										: JSON.stringify(result.cause, null, 2)}
								</pre>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			)}

			{!isSuccess && !isFailure && (
				<pre className="max-h-40 overflow-auto rounded border bg-white p-2 font-mono text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}

			{"config" in result && !!result.config && (
				<Collapsible open={showConfig} onOpenChange={setShowConfig}>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1 rounded px-2 py-1 text-gray-600 text-xs hover:bg-gray-200"
						>
							{showConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
							Configuration
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<pre className="mt-2 max-h-40 overflow-auto rounded border bg-white p-2 font-mono text-xs">
							{JSON.stringify(result.config, null, 2)}
						</pre>
					</CollapsibleContent>
				</Collapsible>
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
