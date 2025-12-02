"use client"

import type { ActionRuns, AutomationRuns, CommunitiesId, StagesId } from "db/public"
import type { FullAutomation } from "db/types"

import { useCallback } from "react"
import { Copy, Pencil, Trash2 } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"

import { DynamicIcon, type IconConfig } from "ui/dynamic-icon"
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "ui/item"
import { toast } from "ui/use-toast"

import { getTriggerByName } from "~/actions/_lib/triggers"
import { EllipsisMenu, EllipsisMenuButton } from "~/app/components/EllipsisMenu"
import { didSucceed, useServerAction } from "~/lib/serverActions"
import { deleteAutomation, duplicateAutomation } from "../../../actions"

type Props = {
	stageId: StagesId
	communityId: CommunitiesId
	automation: FullAutomation & {
		lastAutomationRun: (AutomationRuns & { actionRuns: ActionRuns[] }) | null
	}
}

import { useEffect, useState } from "react"
import { isAfter, parseISO } from "date-fns"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card"
import { cn } from "utils"

import { AutomationRunResult } from "~/app/components/ActionUI/AutomationRunResult"

export const UpdateCircle = (
	props: AutomationRuns & {
		actionRuns: ActionRuns[]
		status: "success" | "failure" | "scheduled" | "partial"
		stale: boolean
		setStale: (stale: boolean) => void
		setInitTime: (initTime: Date) => void
	}
) => {
	const status = props.status

	return (
		<HoverCard>
			<HoverCardTrigger
				onMouseOver={() => {
					if (props.stale === true) {
						props.setStale(false)
						props.setInitTime(new Date())
					}
				}}
			>
				<div
					data-testid={`automation-run-${props.id}-update-circle`}
					data-status={status}
					className={cn(
						"relative m-1 h-3 w-3 rounded-full transition-colors duration-200",
						{
							"bg-green-500": status === "success",
							"bg-red-500": status === "failure",
							"bg-yellow-500": status === "scheduled",
							"bg-gray-500":
								status !== "success" &&
								status !== "failure" &&
								status !== "scheduled",
						}
					)}
				>
					{props.stale && (
						<span
							data-testid={`automation-run-${props.id}-update-circle-stale`}
							className="-top-0.5 absolute right-0 block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-800"
						></span>
					)}
				</div>
			</HoverCardTrigger>
			<HoverCardContent className="max-h-[32rem] w-96 overflow-auto p-3">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<div
							className={cn("h-3 w-3 rounded-full", {
								"bg-green-500": status === "success",
								"bg-red-500": status === "failure",
								"bg-yellow-500": status === "scheduled",
								"bg-gray-500":
									status !== "success" &&
									status !== "failure" &&
									status !== "scheduled",
							})}
						/>
						<span className="font-medium capitalize">{status}</span>
					</div>

					<div className="text-gray-600 text-xs">
						{props.createdAt && (
							<div className="flex items-center justify-between">
								<span>Timestamp: </span>
								<span
									className="font-mono"
									data-testid={`automation-run-${props.id}-update-circle-timestamp`}
								>
									{props.createdAt.toLocaleString()}
								</span>
							</div>
						)}

						{props.actionRuns.at(-1)?.pubId && (
							<div className="flex items-center justify-between">
								<span>ID:</span>
								<span className="truncate font-mono">
									{props.actionRuns.at(-1)?.pubId}
								</span>
							</div>
						)}
					</div>

					{props.actionRuns.length > 0 && (
						<div className="pt-1">
							<div className="font-medium text-xs">Result:</div>
							<div
								className="mt-1"
								data-testid={`automation-run-${props.id}-update-circle-result`}
							>
								<AutomationRunResult
									automationRun={props}
									showOverallStatus={false}
								/>
							</div>
						</div>
					)}
				</div>
			</HoverCardContent>
		</HoverCard>
	)
}

export const StagePanelAutomation = (props: Props) => {
	const [initTime, setInitTime] = useState(new Date())
	const [isStale, setIsStale] = useState(false)

	useEffect(() => {
		if (!props.automation.lastAutomationRun) return

		// parse both as UTC to ensure proper comparison regardless of local timezone
		const lastRunTime = parseISO(`${props.automation.lastAutomationRun.createdAt.toString()}Z`)

		// compare the dates using date-fns isAfter helper
		if (isAfter(lastRunTime, initTime)) {
			setIsStale(true)
		}
	}, [props.automation.lastAutomationRun])

	const { automation } = props

	const [, setEditingAutomationId] = useQueryState(
		"automation-id",
		parseAsString.withDefault("new-automation")
	)

	const onEditClick = useCallback(() => {
		setEditingAutomationId(automation.id)
	}, [automation.id, setEditingAutomationId])

	const runDeleteAutomation = useServerAction(deleteAutomation)
	const onDeleteClick = useCallback(async () => {
		const res = await runDeleteAutomation(automation.id, props.stageId)
		if (didSucceed(res)) {
			toast({
				title: "Automation deleted successfully",
			})
		}
	}, [props.stageId, runDeleteAutomation, automation.id])

	const runDuplicateAutomation = useServerAction(duplicateAutomation)
	const onDuplicateClick = useCallback(async () => {
		const res = await runDuplicateAutomation(automation.id, props.stageId)
		if (didSucceed(res)) {
			toast({
				title: "Automation duplicated successfully",
			})
		}
	}, [props.stageId, runDuplicateAutomation, automation.id])

	const triggerIcons = automation.triggers.map((trigger) => getTriggerByName(trigger.event))
	console.log(automation.lastAutomationRun)

	return (
		<Item variant="outline" size="sm">
			<ItemMedia>
				<DynamicIcon icon={automation.icon as IconConfig} size={16} />
			</ItemMedia>
			<ItemContent className="w-full flex-row items-center justify-between">
				<ItemTitle>{automation.name}</ItemTitle>
				<div className="flex items-center gap-2 rounded-full border bg-gray-50 p-2">
					{triggerIcons.map((icon) => (
						<icon.display.icon key={icon.event} className="h-3 w-3 text-xs" />
					))}
				</div>
			</ItemContent>

			<ItemActions>
				{props.automation.lastAutomationRun && (
					<UpdateCircle
						{...props.automation.lastAutomationRun}
						stale={isStale}
						setStale={setIsStale}
						setInitTime={setInitTime}
					/>
				)}
				<EllipsisMenu>
					<EllipsisMenuButton onClick={onEditClick}>
						<Pencil size={14} /> Edit
					</EllipsisMenuButton>
					<EllipsisMenuButton onClick={onDuplicateClick}>
						<Copy size={14} /> Duplicate
					</EllipsisMenuButton>
					<EllipsisMenuButton onClick={onDeleteClick} className="text-destructive">
						<Trash2 size={14} /> Delete
					</EllipsisMenuButton>
				</EllipsisMenu>
			</ItemActions>
		</Item>
	)
}
