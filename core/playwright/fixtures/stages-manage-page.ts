import type { Page } from "@playwright/test"
import type { AutomationEvent, StagesId } from "db/public"
import type { IconConfig } from "ui/dynamic-icon"
import type { Action } from "~/actions/types"

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
			name: string
			icon?: IconConfig
			event: AutomationEvent
			actions: Action extends Action
				? {
						action: Action["name"]
						// config: Action['config']['schema']['_input']
						configureAction: () => Promise<void>
					}
				: never
			sourceAutomationName?: string
		}
	) {
		await this.openStagePanelTab(stageName, "Automations")

		await this.page.getByTestId("add-automation-button").click({ timeout: 1_000 })

		await this.page.getByRole("textbox", { name: "Automation name" }).fill(automation.name)

		if (automation.icon) {
			await this.page.getByTestId("icon-picker-button").click({ timeout: 1_000 })
			await this.page
				.getByTestId(`icon-picker-item-${automation.icon.name}`)
				.click({ timeout: 1_000 })
			if (automation.icon.color) {
				await this.page.getByTestId("color-picker-button").click({ timeout: 1_000 })
				await this.page.getByTestId(`color-picker-input`).fill(automation.icon.color)
			}
		}

		await this.page.getByTestId("event-select-trigger").click({
			timeout: 1_000,
		})
		await this.page.getByTestId(`trigger-select-item-${automation.event}`).click({
			timeout: 1_000,
		})

		await this.page.getByTestId("action-selector-select-trigger").click({
			timeout: 2_000,
		})
		await this.page.getByTestId(`${automation.actions.action}-button`).click({
			timeout: 1_000,
		})

		if (automation.actions.configureAction) {
			// await this.page
			// 	.getByTestId(`action-config-card-${automation.actions.action}-collapse-trigger`)
			// 	.click({
			// 		timeout: 1_000,
			// 	})
			await automation.actions.configureAction()
		}

		if (automation.sourceAutomationName) {
			await this.page.getByTestId(`watched-automation-select-trigger`).click({
				timeout: 1_000,
			})
			await this.page
				.getByTestId(`watched-automation-select-item-${automation.sourceAutomationName}`)
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
