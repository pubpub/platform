"use client"

import type { ActionRuns, AutomationRuns } from "db/public"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

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
		return <div className={cn("text-gray-500 text-sm", className)}>No action runs found</div>
	}

	return (
		<div className={cn("space-y-2", className)}>
			{showOverallStatus && (
				<div className="flex items-center gap-2">
					<span className="text-gray-600 text-xs">Overall Status:</span>
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
							<div key={actionRun.id} className="rounded border border-gray-200 p-2">
								<button
									type="button"
									onClick={() => toggleActionRun(actionRun.id)}
									className="flex w-full items-center justify-between text-sm"
								>
									<div className="flex items-center gap-2">
										{isExpanded ? (
											<ChevronDown size={16} />
										) : (
											<ChevronRight size={16} />
										)}
										<span className="font-medium">Action {index + 1}</span>
										<ActionRunStatusBadge status={actionRun.status} />
									</div>
								</button>
								{isExpanded && (
									<div className="mt-2 pl-6">
										<ActionRunResult actionRun={actionRun} />
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export const AutomationRunStatusBadge = ({ status }: { status: AutomationRunComputedStatus }) => {
	const getStatusColor = () => {
		switch (status) {
			case "success":
				return "bg-green-500"
			case "failure":
				return "bg-red-500"
			case "scheduled":
				return "bg-yellow-500"
			case "partial":
				return "bg-orange-500"
			default:
				return "bg-gray-500"
		}
	}

	return (
		<div
			className={cn("h-3 w-3 rounded-full transition-colors duration-200", getStatusColor())}
			title={status}
		/>
	)
}
