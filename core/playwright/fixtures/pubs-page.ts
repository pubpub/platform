import type { Page } from "@playwright/test";

export class PubsPage {
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
	}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/pubs`);
	}

	async goToSeededPub() {
		await this.goTo();
		await this.page.getByRole("link", { name: "The Activity of Slugs I. The" }).click();
		await this.page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
	}
}
