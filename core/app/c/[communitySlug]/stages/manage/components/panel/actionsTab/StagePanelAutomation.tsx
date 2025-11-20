"use client"

import type {
	Action,
	ActionInstances,
	ActionInstancesId,
	AutomationsId,
	CommunitiesId,
	Event,
	StagesId,
} from "db/public"
import type { AutomationForEvent } from "~/actions/_lib/automations"
import type { AutomationConfig } from "~/actions/types"

import { useCallback } from "react"
import { parseAsString, useQueryState } from "nuqs"

import { Button } from "ui/button"
import { Pencil } from "ui/icon"
import { cn } from "utils"

import { getActionByName, getAutomationByName, humanReadableEventHydrated } from "~/actions/api"
import { useCommunity } from "~/app/components/providers/CommunityProvider"

type Props = {
	stageId: StagesId
	communityId: CommunitiesId
	automation: {
		id: AutomationsId
		event: Event
		actionInstance: ActionInstances
		sourceActionInstance?: ActionInstances | null
		config: AutomationConfig<AutomationForEvent<Event>> | null
		createdAt: Date
		updatedAt: Date
		actionInstanceId: ActionInstancesId
		sourceActionInstanceId: ActionInstancesId | null
	}
}

const ActionIcon = (props: { actionName: Action; className?: string }) => {
	const action = getActionByName(props.actionName)
	return <action.icon className={cn("inline text-sm", props.className)} />
}

export const StagePanelAutomation = (props: Props) => {
	const { automation } = props

	const [, setEditingAutomationId] = useQueryState(
		"automation-id",
		parseAsString.withDefault("new-automation")
	)

	const onEditClick = useCallback(() => {
		setEditingAutomationId(automation.id)
	}, [automation.id, setEditingAutomationId])
	const community = useCommunity()
	const automationSettings = getAutomationByName(automation.event)

	return (
		<div className="w-full space-y-2 border px-3 py-2">
			<div className="flex w-full items-center justify-between space-x-4 text-sm">
				<div className="flex items-center gap-2 overflow-auto">
					<span className="flex-grow-0 overflow-auto text-ellipsis">
						When{" "}
						<span className="italic underline decoration-dotted">
							{
								<automationSettings.display.icon className="mr-1 inline h-4 w-4 text-xs" />
							}
							{automation.sourceActionInstance ? (
								<>
									<ActionIcon
										actionName={automation.sourceActionInstance.action}
										className="mr-1 inline h-4 w-4 text-xs"
									/>
									{humanReadableEventHydrated(automation.event, community, {
										automation: automation,
										config: automation.config?.automationConfig ?? undefined,
										sourceAction: automation.sourceActionInstance,
									})}
								</>
							) : (
								humanReadableEventHydrated(automation.event, community, {
									automation: automation,
									config: automation.config?.automationConfig ?? undefined,
									sourceAction: automation.sourceActionInstance,
								})
							)}
						</span>
						<br /> run{" "}
						<span className="italic underline decoration-dotted">
							<ActionIcon
								actionName={automation.actionInstance.action}
								className="mx-1 h-4 w-4 text-xs"
							/>
							{automation.actionInstance.name}
						</span>{" "}
					</span>
				</div>
				<div className="flex-gap-1">
					<Button variant="ghost" size="sm" className="flex gap-2" onClick={onEditClick}>
						<Pencil size={14} />
					</Button>
				</div>
			</div>
		</div>
	)
}
