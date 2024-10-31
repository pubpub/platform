import type { Page } from "@playwright/test";

export class PubTypesPage {
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

	async addType(name: string, description: string, fieldSlugs?: string[]) {
		await this.page.getByRole("button", { name: "Create Type", exact: true }).click();
		const dialog = this.page.getByRole("dialog", { name: "Create Type", exact: true });

		await dialog.getByRole("textbox", { name: "Type Name", exact: true }).fill(name);
		await dialog.getByRole("textbox", { name: "Description", exact: true }).fill(description);

		const fieldCombobox = dialog.getByRole("combobox", { name: "Search fields" });

		// If no fields passed, add all fields to pub type
		if (!fieldSlugs) {
			const options = await this.page
				.getByRole("listbox", { name: "Available fields", exact: true })
				.getByRole("option")
				.all();
			for (const option of options) {
				await fieldCombobox.click();
				await option.click();
			}
		} else {
			for (const slug of fieldSlugs) {
				await fieldCombobox.click();
				const option = this.page.getByTestId(`option-${this.communitySlug}:${slug}`);
				await option.click();
			}
		}

		await dialog.getByRole("button", { name: "Create type" }).click();

		await dialog.waitFor({ state: "hidden" });
	}
}
