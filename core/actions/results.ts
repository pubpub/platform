import type { ActionInstances, ActionRuns, AutomationRuns, AutomationRunsId } from "db/public"
import type { BaseActionInstanceConfig } from "db/types"

import { ActionRunStatus } from "db/public"

export type ActionRunResultSuccess = {
	success: true
	title?: string
	report?: string | string
	data: unknown
	config: BaseActionInstanceConfig
}

export type ActionRunResultFailure = {
	success: false
	title?: string
	error?: unknown
	report: string
	config: BaseActionInstanceConfig
}

export type ActionRunResult = ActionRunResultSuccess | ActionRunResultFailure

export const isActionSuccess = (result: unknown): result is ActionRunResultSuccess => {
	return (
		typeof result === "object" &&
		result !== null &&
		"success" in result &&
		result.success === true
	)
}

export const isActionFailure = (result: unknown): result is ActionRunResultFailure => {
	return (
		typeof result === "object" &&
		result !== null &&
		"success" in result &&
		result.success === false
	)
}

export type AutomationRunResultSuccess = {
	success: true
	title?: string
	report?: string
	actionRuns: (ActionRunResult & { actionInstance: ActionInstances })[]
	stack: AutomationRunsId[]
}

export type AutomationRunResultFailure = {
	success: false
	title?: string
	report?: string
	actionRuns: (ActionRunResult & { actionInstance: ActionInstances })[]
	stack: AutomationRunsId[]
}

export type AutomationRunResult = AutomationRunResultSuccess | AutomationRunResultFailure

export type AutomationRunComputedStatus = ActionRunStatus | "partial"

export type AutomationRunWithStatus = AutomationRuns & {
	actionRuns: ActionRuns[]
	status: AutomationRunComputedStatus
}

export const getAutomationRunStatus = (automationRun: {
	actionRuns: { status: ActionRunStatus }[]
}): AutomationRunComputedStatus => {
	if (!automationRun.actionRuns || automationRun.actionRuns.length === 0) {
		return ActionRunStatus.scheduled
	}

	const statuses = automationRun.actionRuns.map((ar) => ar.status)

	if (statuses.every((s) => s === ActionRunStatus.success)) {
		return ActionRunStatus.success
	}

	if (statuses.every((s) => s === ActionRunStatus.failure)) {
		return ActionRunStatus.failure
	}

	if (statuses.every((s) => s === ActionRunStatus.scheduled)) {
		return ActionRunStatus.scheduled
	}

	return "partial"
}

export const getActionRunStatusFromResult = (result: unknown): ActionRunStatus => {
	if (isActionSuccess(result)) {
		return ActionRunStatus.success
	}

	if (isActionFailure(result)) {
		return ActionRunStatus.failure
	}

	return ActionRunStatus.scheduled
}
