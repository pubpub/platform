import type { Page } from "@playwright/test"
import type { AutomationEvent, StagesId } from "db/public"

import { test } from "@playwright/test"

import { slugifyString } from "~/lib/string"

export class StagesManagePage {
	private readonly communitySlug: string

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug
	}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/stages/manage`)
	}

	async addStage(stageName: string) {
		await this.page.keyboard.press("Control+n")
		const node = this.getStageNode("Untitled Stage")
		await node.dblclick()

		const configureButton = node.getByRole("link")
		const stageHref = await configureButton.getAttribute("href")
		const stageId = stageHref?.split("editingStageId=")[1]
		test.expect(stageId).not.toBeNull()

		const nameInput = node.getByLabel("Edit stage name")

		await nameInput.fill(stageName)
		await nameInput.press("Enter")
		await this.page.waitForTimeout(1000)

		return {
			id: stageId! as StagesId,
			name: stageName,
		}
	}

	async addMoveConstraint(sourceStage: string, destStage: string) {
		const source = this.getStageNode(sourceStage)
		const dest = this.getStageNode(destStage)

		await source
			.getByTestId("move-constraint-source-handle")
			.dragTo(dest.getByTestId("move-constraint-target-handle"))
	}

	getStageNode(stageName: string) {
		return this.page.getByTestId(`stage-${slugifyString(stageName)}`)
	}

	async openStagePanel(stageName: string) {
		const node = this.getStageNode(stageName)
		const configureButton = node.getByLabel("Configure stage")
		await configureButton.click()
		return
	}

	async openStagePanelTab(
		stageName: string,
		tab: "Overview" | "Pubs" | "Automations" | "Members"
	) {
		await this.openStagePanel(stageName)
		const stagePanel = this.page.getByRole("dialog")
		await stagePanel.getByRole("tab", { name: tab }).click()
	}

	/**
	 * TODO: add support for config
	 */
	async addAutomation(
		stageName: string,
		automation: {
			event: AutomationEvent
			actionInstanceName: string
			sourceActionInstanceName?: string
		}
	) {
		await this.openStagePanelTab(stageName, "Automations")

		await this.page.getByTestId("add-automation-button").click({ timeout: 1_000 })

		await this.page.getByTestId("action-selector-select-trigger").click({
			timeout: 2_000,
		})
		await this.page
			.getByTestId(`action-selector-select-item-${automation.actionInstanceName}`)
			.click({
				timeout: 1_000,
			})

		await this.page.getByTestId("event-select-trigger").click({
			timeout: 1_000,
		})
		await this.page.getByTestId(`event-select-item-${automation.event}`).click({
			timeout: 1_000,
		})

		if (automation.sourceActionInstanceName) {
			await this.page.getByTestId("watched-action-select-trigger").click({
				timeout: 1_000,
			})
			await this.page
				.getByTestId(`watched-action-select-item-${automation.sourceActionInstanceName}`)
				.click({
					timeout: 1_000,
				})
		}

		await this.page
			.getByRole("button", {
				name: "Save automation",
				exact: true,
			})
			.click({
				timeout: 1_000,
			})
	}
}
