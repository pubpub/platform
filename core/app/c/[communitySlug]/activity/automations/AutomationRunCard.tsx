"use client"

import type { Action } from "db/public"
import type { FullAutomationRun } from "~/lib/server/actions"

import { useState } from "react"
import Link from "next/link"
import { User, Zap } from "lucide-react"

import { AutomationEvent } from "db/public"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { DynamicIcon } from "ui/dynamic-icon"

import { actions } from "~/actions/api"
import { getAutomationRunStatus } from "~/actions/results"
import { ActionRunResult } from "~/app/components/AutomationUI/ActionRunResult"
import { AutomationRunStatusBadge } from "~/app/components/AutomationUI/AutomationRunResult"
import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu"
import { PubCardClient } from "~/app/components/pubs/PubCard/PubCardClient"
import { formatDateAsPossiblyDistance } from "~/lib/dates"

type AutomationRunCardProps = {
	automationRun: FullAutomationRun
	communitySlug: string
}

const getTriggerDescription = (automationRun: AutomationRunCardProps["automationRun"]): string => {
	if (automationRun.sourceUser) {
		return `${automationRun.sourceUser.firstName} ${automationRun.sourceUser.lastName}`
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
	automationRun: AutomationRunCardProps["automationRun"]
): React.ReactNode => {
	if (automationRun.inputPub) {
		return (
			<PubCardClient
				pub={{ ...automationRun.inputPub, stageId: null }}
				showCheckbox={false}
			/>
		)
	}

	if (automationRun.inputJson) {
		const jsonString = JSON.stringify(automationRun.inputJson)
		const preview = jsonString.length > 50 ? `${jsonString.slice(0, 50)}...` : jsonString
		return <code className="rounded bg-gray-100 px-1 text-xs">{preview}</code>
	}

	return <span className="text-gray-500">No input</span>
}

export const AutomationRunCard = ({ automationRun, communitySlug }: AutomationRunCardProps) => {
	const status = getAutomationRunStatus(automationRun)
	const triggerDescription = getTriggerDescription(automationRun)
	const inputDescription = getInputDescription(automationRun)

	const stage = automationRun.stage
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div
			className="gap-4 rounded-md border border-gray-200 bg-white p-4"
			style={{ gridTemplateRows: "auto auto" }}
			data-testid={`automation-run-card-${automationRun.id}`}
		>
			{/* Header - spans both columns on large screens */}
			<Collapsible className="flex flex-col gap-3" onOpenChange={setIsOpen}>
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-md border p-0">
						{automationRun.automation?.icon ? (
							<DynamicIcon icon={automationRun.automation.icon} size={16} />
						) : (
							<Zap size={16} />
						)}
					</div>
					<div className="flex flex-1 flex-col gap-1">
						<div className="flex items-center justify-between">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-medium text-sm">
									{automationRun.automation?.name || "Unknown Automation"}
								</h3>
								<AutomationRunStatusBadge
									status={status}
									className="px-2 py-0 text-xs"
								/>
							</div>
							{stage && (
								<EllipsisMenu orientation="horizontal" triggerSize="icon">
									<EllipsisMenuButton asChild>
										<Link href={`/c/${communitySlug}/stages/${stage.id}`}>
											View Stage
										</Link>
									</EllipsisMenuButton>
									<EllipsisMenuButton asChild>
										<Link
											href={`/c/${communitySlug}/stages/manage?editingStageId=${stage.id}&tab=automations`}
										>
											Edit Stage
										</Link>
									</EllipsisMenuButton>
									<EllipsisMenuButton asChild>
										<Link
											href={`/c/${communitySlug}/stages/manage?editingStageId=${stage.id}&tab=automations&automation-id=${automationRun.automation?.id}`}
										>
											Edit Automation
										</Link>
									</EllipsisMenuButton>
								</EllipsisMenu>
							)}
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5 text-gray-600 text-xs">
								<User size={12} />
								<span>{triggerDescription}</span>
								<span>·</span>
								<time
									dateTime={new Date(automationRun.createdAt).toISOString()}
									title={new Date(automationRun.createdAt).toLocaleString()}
								>
									{formatDateAsPossiblyDistance(
										new Date(automationRun.createdAt)
									)}
								</time>
							</div>
							<CollapsibleTrigger className="text-end text-muted-foreground text-xs">
								{isOpen ? "Hide details" : "Show details"}
							</CollapsibleTrigger>
						</div>
					</div>
				</div>
				<CollapsibleContent className="flex flex-col gap-3">
					<div className="flex flex-col gap-2 border-gray-200 border-t pt-3 lg:col-start-2 lg:w-64 lg:border-t-0 lg:pt-0">
						<h4 className="font-medium text-xs">Input</h4>
						{inputDescription}
					</div>
					{/* Actions - left side */}

					<div className="flex flex-col gap-2 border-gray-200 border-t pt-3 lg:border-t-0 lg:pt-0">
						<h4 className="font-medium text-xs">Actions</h4>
						{automationRun.actionRuns.length > 0 && (
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
						)}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	)
}
