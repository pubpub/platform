"use client"

import type { Action, ActionRuns, AutomationRuns } from "db/public"
import type { IconConfig } from "ui/dynamic-icon"

import Link from "next/link"
import { User, Zap } from "lucide-react"

import { AutomationEvent } from "db/public"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion"
import { DynamicIcon } from "ui/dynamic-icon"

import { actions } from "~/actions/api"
import { getAutomationRunStatus } from "~/actions/results"
import { ActionRunResult } from "~/app/components/AutomationUI/ActionRunResult"
import { AutomationRunStatusBadge } from "~/app/components/AutomationUI/AutomationRunResult"
import { formatDateAsPossiblyDistance } from "~/lib/dates"

type AutomationRunCardProps = {
	automationRun: AutomationRuns & {
		actionRuns: (ActionRuns & {
			pubId: string | null
			pubTitle: string | null
			json: unknown
		})[]
		automation: {
			id: string
			name: string
			icon: IconConfig | null
		} | null
		user: {
			id: string
			firstName: string | null
			lastName: string | null
		} | null
		stage: {
			id: string
			name: string
		} | null
	}
	communitySlug: string
}

const getTriggerDescription = (automationRun: AutomationRunCardProps["automationRun"]): string => {
	if (automationRun.user) {
		return `${automationRun.user.firstName} ${automationRun.user.lastName}`
	}

	switch (automationRun.triggerEvent) {
		case AutomationEvent.automationFailed:
			return "Automation failed"
		case AutomationEvent.automationSucceeded:
			return "Automation succeeded"
		case AutomationEvent.pubEnteredStage:
			return `Pub entered stage${automationRun.stage ? `: ${automationRun.stage.name}` : ""}`
		case AutomationEvent.pubLeftStage:
			return `Pub left stage${automationRun.stage ? `: ${automationRun.stage.name}` : ""}`
		case AutomationEvent.pubInStageForDuration:
			return `Pub in stage for duration${automationRun.stage ? `: ${automationRun.stage.name}` : ""}`
		case AutomationEvent.webhook:
			return "Webhook"
		case AutomationEvent.manual:
			return "Manual trigger"
		default:
			return "Unknown trigger"
	}
}

const getInputDescription = (
	automationRun: AutomationRunCardProps["automationRun"],
	communitySlug: string
): React.ReactNode => {
	const firstActionRun = automationRun.actionRuns[0]

	if (!firstActionRun) {
		return <span className="text-gray-500">No input</span>
	}

	if (firstActionRun.pubId && firstActionRun.pubTitle) {
		return (
			<Link
				href={`/c/${communitySlug}/pubs/${firstActionRun.pubId}`}
				className="text-blue-600 underline hover:text-blue-800"
			>
				{firstActionRun.pubTitle}
			</Link>
		)
	}

	if (firstActionRun.json) {
		const jsonString = JSON.stringify(firstActionRun.json)
		const preview = jsonString.length > 50 ? `${jsonString.slice(0, 50)}...` : jsonString
		return <code className="rounded bg-gray-100 px-1 text-xs">{preview}</code>
	}

	return <span className="text-gray-500">No input</span>
}

export const AutomationRunCard = ({ automationRun, communitySlug }: AutomationRunCardProps) => {
	const status = getAutomationRunStatus(automationRun)
	const triggerDescription = getTriggerDescription(automationRun)
	const inputDescription = getInputDescription(automationRun, communitySlug)

	return (
		<div
			className="grid grid-cols-1 items-baseline gap-4 rounded-md border border-gray-200 bg-white p-4 lg:grid-cols-2"
			style={{ gridTemplateRows: "auto auto" }}
			data-testid={`automation-run-card-${automationRun.id}`}
		>
			{/* Header - spans both columns on large screens */}
			<div className="flex items-center gap-3 lg:col-span-2">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
					{automationRun.automation?.icon ? (
						<DynamicIcon icon={automationRun.automation.icon} size={16} />
					) : (
						<Zap size={16} />
					)}
				</div>
				<div className="flex flex-1 flex-col gap-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-medium text-sm">
							{automationRun.automation?.name || "Unknown Automation"}
						</h3>
						<AutomationRunStatusBadge status={status} />
					</div>
					<div className="flex items-center gap-1.5 text-gray-600 text-xs">
						<User size={12} />
						<span>{triggerDescription}</span>
						<span>·</span>
						<span>
							{formatDateAsPossiblyDistance(new Date(automationRun.createdAt))}
						</span>
					</div>
				</div>
			</div>

			{/* Actions - left side */}
			{automationRun.actionRuns.length > 0 && (
				<div className="ml-11">
					<Accordion type="multiple" className="w-full">
						{automationRun.actionRuns.map((actionRun) => {
							const action = actions[actionRun.action as Action]
							return (
								<AccordionItem key={actionRun.id} value={actionRun.id}>
									<AccordionTrigger className="py-2 text-sm hover:no-underline">
										<div className="flex items-center gap-2">
											{action && <action.icon size={16} />}
											<span className="font-medium">
												{action?.niceName || "Unknown Action"}
											</span>
											{actionRun.status && (
												<span
													className={`rounded px-1.5 py-0.5 text-xs ${
														actionRun.status === "success"
															? "bg-green-100 text-green-700"
															: actionRun.status === "failure"
																? "bg-red-100 text-red-700"
																: "bg-yellow-100 text-yellow-700"
													}`}
												>
													{actionRun.status}
												</span>
											)}
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<ActionRunResult actionRun={actionRun} />
									</AccordionContent>
								</AccordionItem>
							)
						})}
					</Accordion>
				</div>
			)}

			{/* Input - right side on desktop, below on mobile */}
			<div className="flex flex-col gap-1.5 border-gray-200 border-t pt-3 lg:col-start-2 lg:w-64 lg:border-t-0 lg:pt-0">
				<div className="text-sm">{inputDescription}</div>
			</div>
		</div>
	)
}
