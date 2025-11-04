import type { Locator, Page } from "@playwright/test";

import type { PubsId } from "db/public";

import { closeToast } from "../helpers";

export class PubDetailsPage {
	constructor(
		public readonly page: Page,
		private readonly communitySlug: string,
		private readonly pubId: PubsId
	) {}

	async goTo(waitForUrl = true) {
		await this.page.goto(`/c/${this.communitySlug}/pubs/${this.pubId}`);
		if (waitForUrl) {
			await this.page.waitForURL(`/c/${this.communitySlug}/pubs/${this.pubId}*`);
		}
	}

	async runAction(
		actionName: string,
		configureCallback?: (runActionDialog: Locator) => Promise<void>,
		waitForSuccess = true
	) {
		await this.page.getByTestId("run-action-primary").click();
		await this.page.getByRole("button", { name: actionName }).click();

		const runActionDialog = this.page.getByRole("dialog", { name: actionName, exact: true });
		await runActionDialog.waitFor();

		await configureCallback?.(runActionDialog);

		await runActionDialog.getByTestId("action-run-button").click();
		if (waitForSuccess) {
			await this.page
				.getByRole("status")
				.filter({ hasText: `Successfully ran ${actionName}` })
				.waitFor();
			await runActionDialog.getByRole("button", { name: "Close", exact: true }).click();
			await runActionDialog.waitFor({ state: "hidden" });
		}
	}

	async openAddMemberDialog() {
		await this.page.getByText("Add Member", { exact: true }).click();
		const addMemberDialog = this.page.getByRole("dialog", { name: "Add Member" });
		await addMemberDialog.waitFor();
		return addMemberDialog;
	}

	async removePub() {
		await this.page.getByRole("button", { name: "Remove" }).click();
		await this.page.getByRole("button", { name: "Permanently Remove Pub" }).click({
			timeout: 5000,
		});
		await this.page
			.getByRole("status")
			.filter({ hasText: "Successfully removed the pub" })
			.first()
			.waitFor();
		await closeToast(this.page);
	}
}
