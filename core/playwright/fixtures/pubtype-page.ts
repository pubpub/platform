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

	async addFieldToPubType(pubTypeName: string, fieldSlug: string) {
		await this.page.getByTestId(`edit-pubtype-${pubTypeName}`).click();
		await this.page.getByRole("combobox").click();
		await this.page.getByRole("option", { name: fieldSlug }).click();
	}
}
