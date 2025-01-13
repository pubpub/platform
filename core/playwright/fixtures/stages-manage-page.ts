import type { Page } from "@playwright/test";

import type { Action } from "db/public";

import { slugifyString } from "~/lib/string";

export class StagesManagePage {
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
	}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/stages/manage`);
	}

	async addStage(stageName: string) {
		await this.page.keyboard.press("Control+n");
		const node = this.getStageNode("Untitled Stage");
		await node.dblclick();
		const nameInput = node.getByLabel("Edit stage name");
		await nameInput.fill(stageName);
		await nameInput.press("Enter");
		await this.page.waitForTimeout(1000);
	}

	async addMoveConstraint(sourceStage: string, destStage: string) {
		const source = this.getStageNode(sourceStage);
		const dest = this.getStageNode(destStage);

		await source
			.getByTestId("move-constraint-source-handle")
			.dragTo(dest.getByTestId("move-constraint-target-handle"));
	}

	getStageNode(stageName: string) {
		return this.page.getByTestId(`stage-${slugifyString(stageName)}`);
	}

	async openStagePanel(stageName: string) {
		const node = this.getStageNode(stageName);
		const configureButton = node.getByLabel("Configure stage");
		await configureButton.click();
		return;
	}

	async openStagePanelTab(stageName: string, tab: "Overview" | "Pubs" | "Actions" | "Members") {
		await this.openStagePanel(stageName);
		const stagePanel = this.page.getByRole("dialog");
		await stagePanel.getByRole("tablist").getByText(tab).click();
	}

	async addAction(stageName: string, action: Action, actionName: string) {
		await this.openStagePanelTab(stageName, "Actions");
		const stagePanel = this.page.getByRole("dialog");

		await stagePanel.getByRole("button", { name: "Add an action", exact: true }).click();

		await this.page.getByTestId("add-action-dialog").getByTestId(`${action}-button`).click();

		const actionInstance = stagePanel.getByTestId(`action-instance-${action}`);

		const editButton = actionInstance.getByLabel("Edit action", { exact: true });
		await editButton.click();
		await stagePanel.getByLabel("Edit action name", { exact: true }).fill(actionName);
		await editButton.click();
	}
}
