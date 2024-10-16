import type { Page } from "@playwright/test";

export class PubTypePage {
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/types`);
	}

	async addFieldToPubType(pubtypeName: string, fieldSlug: string) {
		// TODO
	}
}
