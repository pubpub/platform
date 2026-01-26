"use client"

import type { Action, AutomationEvent, Communities } from "db/public"
import type { FullAutomationRun } from "~/lib/server/actions"

import { useState } from "react"
import Link from "next/link"
import { HelpCircle, User, Zap } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "ui/collapsible"
import { DynamicIcon } from "ui/dynamic-icon"

import { humanReadableEventBase, triggers } from "~/actions/_lib/triggers"
import { actions } from "~/actions/api"
import { getAutomationRunStatus } from "~/actions/results"
import { ActionRunResult } from "~/app/components/AutomationUI/ActionRunResult"
import { AutomationRunStatusBadge } from "~/app/components/AutomationUI/AutomationRunResult"
import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu"
import { PubCardClient } from "~/app/components/pubs/PubCard/PubCardClient"
import { formatDateAsPossiblyDistance } from "~/lib/dates"

type AutomationRunCardProps = {
	automationRun: FullAutomationRun
	community: Communities
}

const getTriggerDescription = (
	automationRun: AutomationRunCardProps["automationRun"],
	community: Communities
): { description: string | React.ReactNode; icon: React.ReactNode } => {
	if (automationRun.sourceUser) {
		return {
			description: `${automationRun.sourceUser.firstName} ${automationRun.sourceUser.lastName}`,
			icon: <User size={12} />,
		}
	}

	const trigger = triggers[automationRun.triggerEvent as AutomationEvent]

	if (!trigger) {
		return {
			description: "Unknown trigger",
			icon: <HelpCircle size={12} />,
		}
	}

	const description = humanReadableEventBase(automationRun.triggerEvent, community)

	return {
		description,
		icon: <trigger.display.icon size={12} />,
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
		return <code className="rounded bg-muted px-1 text-xs">{preview}</code>
	}

	return <span className="text-muted-foreground">No input</span>
}

export const AutomationRunCard = ({ automationRun, community }: AutomationRunCardProps) => {
	const status = getAutomationRunStatus(automationRun)
	const triggerDescription = getTriggerDescription(automationRun, community)
	const inputDescription = getInputDescription(automationRun)

	const stage = automationRun.stage
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div
			// makes it pulse in the search results
			data-pulse
			className="min-h-18 gap-4 rounded-md border border-border bg-card p-2"
			style={{ gridTemplateRows: "auto auto" }}
			data-testid={`automation-run-card-${automationRun.id}-${automationRun.automation!.name}`}
		>
			{/* Header - spans both columns on large screens */}
			<Collapsible className="flex flex-col gap-3" onOpenChange={setIsOpen}>
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-md p-0">
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
										<Link href={`/c/${community.slug}/stages/${stage.id}`}>
											View Stage
										</Link>
									</EllipsisMenuButton>
									<EllipsisMenuButton asChild>
										<Link
											href={`/c/${community.slug}/stages/manage?editingStageId=${stage.id}&tab=automations`}
										>
											Edit Stage
										</Link>
									</EllipsisMenuButton>
									<EllipsisMenuButton asChild>
										<Link
											href={`/c/${community.slug}/stages/manage?editingStageId=${stage.id}&tab=automations&automation-id=${automationRun.automation?.id}`}
										>
											Edit Automation
										</Link>
									</EllipsisMenuButton>
								</EllipsisMenu>
							)}
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
								{triggerDescription.icon}
								<span>{triggerDescription.description}</span>
								{stage && (
									<>
										<span>·</span>
										<span>{stage.name}</span>
									</>
								)}

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
					<div className="flex flex-col gap-2 border-border border-t pt-3 lg:col-start-2 lg:w-64 lg:border-t-0 lg:pt-0">
						<h4 className="font-medium text-xs">Input</h4>
						{inputDescription}
					</div>

					<div className="flex flex-col gap-2 border-border border-t pt-3 lg:border-t-0 lg:pt-0">
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
																		? "bg-destructive text-destructive-foreground"
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
