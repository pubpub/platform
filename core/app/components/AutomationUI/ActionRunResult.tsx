"use client"

import type { ActionRuns } from "db/public"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { cn } from "utils"

import { isActionFailure, isActionSuccess } from "~/actions/results"

type Props = {
	actionRun: Pick<ActionRuns, "result" | "status" | "action" | "config" | "updatedAt" | "json">
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
				<pre className="max-h-40 overflow-auto rounded bg-muted p-2 font-mono text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			</div>
		)
	}

	const isSuccess = isActionSuccess(result)
	const isFailure = isActionFailure(result)

	return (
		<div className={cn("space-y-3 rounded-md bg-muted p-3", className)}>
			{isSuccess && (
				<div className="space-y-2">
					{result.title && (
						<div className="font-medium text-green-700 text-sm">{result.title}</div>
					)}
					{result.report && (
						<div className="text-muted-foreground text-sm">
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
										className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground text-xs hover:bg-muted"
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
									<pre className="mt-2 max-h-40 overflow-auto rounded border bg-card p-2 font-mono text-xs">
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
					<div className="text-red-700 text-sm">{result.report}</div>
					{!!result.error && typeof result.error === "string" && (
						<Collapsible open={showCause} onOpenChange={setShowCause}>
							<CollapsibleTrigger asChild>
								<button
									type="button"
									className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground text-xs hover:bg-muted"
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
								<pre className="mt-2 max-h-40 overflow-auto rounded border border-destructive bg-destructive/10 p-2 font-mono text-destructive text-xs">
									{typeof result.error === "string"
										? result.error
										: JSON.stringify(result.error, null, 2)}
								</pre>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			)}

			{!isSuccess && !isFailure && (
				<pre className="max-h-40 overflow-auto rounded border bg-card p-2 font-mono text-xs">
					{JSON.stringify(result, null, 2)}
				</pre>
			)}

			{"config" in result && !!result.config && (
				<Collapsible open={showConfig} onOpenChange={setShowConfig}>
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground text-xs hover:bg-muted"
						>
							{showConfig ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
							Configuration
						</button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<pre className="mt-2 max-h-40 overflow-auto rounded border bg-card p-2 font-mono text-xs">
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
