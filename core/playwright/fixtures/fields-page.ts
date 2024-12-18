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

	async selectFormat(format: CoreSchemaType) {
		await this.formatBox.click();
		await this.page.getByTestId(`select-${format}`).click();
	}

	async addField(
		name: string,
		format: CoreSchemaType,
		/**
		 * Whether to wait for the little pop up that confirms field creation
		 * set to false for testing this function
		 */
		waitForText = true
	) {
		await this.openNewFieldModal();
		await this.nameBox.fill(name);
		await this.selectFormat(format);
		await this.page.getByRole("button", { name: "Create" }).click();
		if (!waitForText) {
			return;
		}
		await this.page.getByText(`Created field ${name}`, { exact: true }).waitFor();
	}

	async addFieldsOfEachType() {
		const schemas = Object.values(CoreSchemaType).filter((s) => s !== CoreSchemaType.Null);
		for (const schema of schemas) {
			await this.addField(schema, schema);
		}
	}
}
