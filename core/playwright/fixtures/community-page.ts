import type { Locator, Page } from "@playwright/test";

export class CommunityPage {
	private readonly nameBox: Locator;
	private readonly slugBox: Locator;

	constructor(public readonly page: Page) {
		this.nameBox = this.page.locator("input[name='name']");
		this.slugBox = this.page.locator("input[name='slug']");
	}

	async goto() {
		await this.page.goto("/communities");
	}

	async addCommunity(name: string, slug: string) {
		await this.page.getByRole("button", { name: "Create Community" }).click();
		const createCommunityDialog = this.page.getByRole("dialog", { name: "Create Community" });
		await this.nameBox.fill(name);
		await this.slugBox.fill(slug);
		await createCommunityDialog.getByRole("button", { name: "Create Community" }).click();
		await createCommunityDialog.waitFor({ state: "hidden" });
	}
}
