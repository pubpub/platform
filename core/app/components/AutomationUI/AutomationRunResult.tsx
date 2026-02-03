"use client"

import type { ActionRuns, AutomationRuns } from "db/public"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { cn } from "utils"

import { type AutomationRunComputedStatus, getAutomationRunStatus } from "~/actions/results"
import { ActionRunResult, ActionRunStatusBadge } from "./ActionRunResult"

type Props = {
	automationRun: AutomationRuns & { actionRuns: ActionRuns[] }
	className?: string
	showOverallStatus?: boolean
}

export const AutomationRunResult = ({
	automationRun,
	className,
	showOverallStatus = false,
}: Props) => {
	const [expandedActionRuns, setExpandedActionRuns] = useState<Set<string>>(new Set())

	const status = getAutomationRunStatus(automationRun)

	const toggleActionRun = (actionRunId: string) => {
		const newExpanded = new Set(expandedActionRuns)
		if (newExpanded.has(actionRunId)) {
			newExpanded.delete(actionRunId)
		} else {
			newExpanded.add(actionRunId)
		}
		setExpandedActionRuns(newExpanded)
	}

	if (!automationRun.actionRuns || automationRun.actionRuns.length === 0) {
		return (
			<div className={cn("text-muted-foreground text-sm", className)}>
				No action runs found
			</div>
		)
	}

	return (
		<div className={cn("space-y-2", className)}>
			{showOverallStatus && (
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-xs">Overall Status:</span>
					<AutomationRunStatusBadge status={status} />
				</div>
			)}

			{automationRun.actionRuns.length === 1 ? (
				<ActionRunResult actionRun={automationRun.actionRuns[0]} />
			) : (
				<div className="space-y-2">
					{automationRun.actionRuns.map((actionRun, index) => {
						const isExpanded = expandedActionRuns.has(actionRun.id)
						return (
							<Collapsible
								key={actionRun.id}
								open={isExpanded}
								onOpenChange={() => toggleActionRun(actionRun.id)}
							>
								<div className="rounded-md border border-border bg-muted p-2">
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="flex w-full items-center justify-between text-sm hover:text-muted-foreground"
										>
											<div className="flex items-center gap-2">
												{isExpanded ? (
													<ChevronDown size={16} />
												) : (
													<ChevronRight size={16} />
												)}
												<span className="font-medium">
													Action {index + 1}
												</span>
												<ActionRunStatusBadge status={actionRun.status} />
											</div>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent className="mt-2 pl-6">
										<ActionRunResult actionRun={actionRun} />
									</CollapsibleContent>
								</div>
							</Collapsible>
						)
					})}
				</div>
			)}
		</div>
	)
}

export const AutomationRunStatusBadge = ({
	status,
	className,
}: {
	status: AutomationRunComputedStatus
	className?: string
}) => {
	const getStatusVariant = () => {
		switch (status) {
			case "success":
				return "default"
			case "failure":
				return "destructive"
			case "scheduled":
				return "secondary"
			case "partial":
				return "outline"
			default:
				return "outline"
		}
	}

	return (
		<Badge
			variant={getStatusVariant()}
			className={cn(
				"capitalize",
				className,
				status === "scheduled" && "bg-yellow-500 hover:bg-yellow-600",
				status === "partial" &&
					"border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
			)}
		>
			{status}
		</Badge>
	)
}
