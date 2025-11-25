import type { getAutomationRuns } from "~/lib/server/actions"
import type { AutoReturnType } from "~/lib/types"
import type { ActionRun } from "./getActionRunsTableColumns"

export const mapAutomationRunsForTable = (
	automationRuns: AutoReturnType<typeof getAutomationRuns>["execute"]
): ActionRun[] => {
	return automationRuns.flatMap((automationRun) => {
		if (!automationRun.actionRuns || automationRun.actionRuns.length === 0) {
			return []
		}

		return automationRun.actionRuns.map((actionRun) => ({
			id: actionRun.id,
			createdAt: actionRun.createdAt,
			automation: automationRun.automation,
			actionInstance: actionRun.actionInstanceId
				? {
						name: automationRun.automation?.name ?? "Unknown",
						action: actionRun.action ?? "unknown",
					}
				: null,
			sourceActionInstance: null,
			stage: automationRun.stage,
			result: actionRun.result,
			event: (actionRun.event as any) ?? null,
			user: automationRun.user,
			pub: actionRun.pubId
				? {
						id: actionRun.pubId,
						title: actionRun.pubTitle ?? "",
					}
				: undefined,
			json: undefined,
			status: actionRun.status,
		})) as ActionRun[]
	})
}
