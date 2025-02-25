import type { Locator, Page } from "@playwright/test";

import type { PubsId } from "db/public";

export class PubDetailsPage {
	constructor(
		public readonly page: Page,
		private readonly communitySlug: string,
		private readonly pubId: PubsId
	) {}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/pubs/${this.pubId}`);
	}

	async runAction(
		actionName: string,
		configureCallback?: (runActionDialog: Locator) => Promise<void>
	) {
		await this.page.getByRole("button", { name: "Run action", exact: true }).click();
		await this.page
			.getByRole("menu", { name: "Run action", exact: true })
			.getByRole("button", { name: actionName, exact: true })
			.click();

		const runActionDialog = this.page.getByRole("dialog", { name: actionName, exact: true });
		await runActionDialog.waitFor();

		await configureCallback?.(runActionDialog);

		await runActionDialog.getByRole("button", { name: "Run", exact: true }).click();
		await this.page
			.getByRole("status")
			.filter({ hasText: "Action ran successfully!" })
			.waitFor();
		await runActionDialog.getByRole("button", { name: "Close", exact: true }).click();
		await runActionDialog.waitFor({ state: "hidden" });
	}
}
