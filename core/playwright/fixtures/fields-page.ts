import type { Locator, Page } from "@playwright/test";

import { CoreSchemaType } from "db/public";

export class FieldsPage {
	private readonly formatBox: Locator;
	private readonly nameBox: Locator;
	private readonly newButton: Locator;
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
		this.newButton = this.page.getByRole("banner").getByRole("button", { name: "New Field" });
		this.formatBox = this.page.getByRole("combobox");
		this.nameBox = this.page.getByRole("textbox", { name: "name" });
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/fields`);
	}

	async openNewFieldModal() {
		await this.newButton.click();
	}

	async addField(name: string, format: CoreSchemaType) {
		await this.openNewFieldModal();
		await this.nameBox.fill(name);
		await this.formatBox.click();
		await this.page.getByRole("option", { name: format }).click();
		await this.page.getByRole("button", { name: "Create" }).click();
	}

	async addFieldsOfEachType() {
		for (const schema of Object.values(CoreSchemaType)) {
			await this.addField(schema, schema);
		}
	}
}
