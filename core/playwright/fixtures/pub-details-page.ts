import type { Locator, Page } from "@playwright/test"
import type { PubsId } from "db/public"

export class PubDetailsPage {
	constructor(
		public readonly page: Page,
		private readonly communitySlug: string,
		private readonly pubId: PubsId
	) {}

	async goTo(waitForUrl = true) {
		await this.page.goto(`/c/${this.communitySlug}/pubs/${this.pubId}`)
		if (waitForUrl) {
			await this.page.waitForURL(`/c/${this.communitySlug}/pubs/${this.pubId}*`)
		}
	}

	async runAutomation(
		automationName: string,
		configureCallback?: (runAutomationDialog: Locator) => Promise<void>,
		waitForSuccess = true
	) {
		await this.page.getByTestId("run-action-primary").click()
		await this.page.getByRole("button", { name: automationName }).click()

		const runAutomationDialog = this.page.getByRole("dialog", {
			name: automationName,
			exact: true,
		})
		await runAutomationDialog.waitFor()

		await configureCallback?.(runAutomationDialog)

		await runAutomationDialog.getByTestId("action-run-button").click()
		if (waitForSuccess) {
			await this.page
				.getByRole("status")
				.filter({ hasText: `Successfully ran ${automationName}` })
				.waitFor()
			await runAutomationDialog.getByRole("button", { name: "Cancel", exact: true }).click()
			await runAutomationDialog.waitFor({ state: "hidden" })
		}
	}

	async openAddMemberDialog() {
		await this.page.getByText("Add Member", { exact: true }).click()
		const addMemberDialog = this.page.getByRole("dialog", { name: "Add Member" })
		await addMemberDialog.waitFor()
		return addMemberDialog
	}

	async removePub() {
		await this.page.getByRole("button", { name: "Remove" }).click()
		await this.page.getByRole("button", { name: "Permanently Remove Pub" }).click({
			timeout: 5000,
		})
		await this.page
			.getByRole("status")
			.filter({ hasText: "Successfully removed the pub" })
			.first()
			.waitFor()
		// await closeToast(this.page)
	}
}
