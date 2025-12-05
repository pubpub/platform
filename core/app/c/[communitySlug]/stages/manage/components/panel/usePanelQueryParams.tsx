"use client"

import type { AutomationsId } from "db/public"

import { parseAsString, useQueryState } from "nuqs"

export function useAutomationId() {
	const [automationId, setAutomationId] = useQueryState(
		"automationId",
		parseAsString.withOptions({
			shallow: true,
		})
	)

	return {
		automationId: automationId as AutomationsId | null,
		setAutomationId: setAutomationId as (automationId: AutomationsId | null) => void,
	}
}

import type { StagesId } from "db/public"
import type { StageManageTab } from "~/lib/links"

export function useEditingStageId() {
	const [editingStageId, setEditingStageId] = useQueryState("editingStageId", parseAsString)

	return {
		editingStageId: editingStageId as StagesId | null,
		setEditingStageId: setEditingStageId as (editingStageId: StagesId | null) => void,
	}
}

export function usePanelTab() {
	const [tab, setTab] = useQueryState("tab", parseAsString)

	return {
		tab: tab as StageManageTab | null,
		setTab: setTab as (tab: StageManageTab | null) => void,
	}
}

export function useClosePanel() {
	const { setEditingStageId } = useEditingStageId()
	const { setTab } = usePanelTab()
	const { setAutomationId } = useAutomationId()

	return () => {
		setEditingStageId(null)
		setTab(null)
		setAutomationId(null)
	}
}
