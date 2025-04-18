import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import type { PubTypesId } from "db/public";

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
		await this.page.getByText("Field added successfully", { exact: true }).waitFor();
	}

	async addType<T extends string>(
		name: string,
		description: string,
		fieldSlugs?: T[],
		title?: T
	) {
		await this.page.getByRole("button", { name: "Create Type", exact: true }).click();
		const dialog = this.page.getByRole("dialog", { name: "Create Type", exact: true });

		await dialog.getByRole("textbox", { name: "Type Name", exact: true }).fill(name);
		await dialog.getByRole("textbox", { name: "Description", exact: true }).fill(description);

		const fieldCombobox = dialog.getByRole("combobox", { name: "Search fields" });

		// If no fields passed, add all fields to pub type
		if (!fieldSlugs) {
			await fieldCombobox.click();
			const options = await this.page
				.getByLabel("Available fields")
				.getByRole("option")
				.all();

			for (const [index] of options.entries()) {
				if (index !== 0) {
					await fieldCombobox.click();
				}
				this.page.getByLabel("Available fields").getByRole("option").first().click();
			}
		} else {
			for (const slug of fieldSlugs) {
				await fieldCombobox.click();
				const option = this.page.getByTestId(`option-${this.communitySlug}:${slug}`);
				await option.click();
			}
		}

		const titleField = title ?? fieldSlugs?.find((slug) => /title/.test(slug));
		if (titleField) {
			await this.page.getByTestId(`${this.communitySlug}:${titleField}-titleField`).click();
		}

		await dialog.getByRole("button", { name: "Create type" }).click();

		await dialog.waitFor({ state: "hidden" });

		// check whether the new type is created
		await this.page.getByRole("heading", { name: name }).waitFor();

		const pubTypeId = await this.page.getByTestId(`pubtype-${name}-id`).textContent();

		expect(pubTypeId).toBeTruthy();

		return {
			name,
			id: pubTypeId! as PubTypesId,
		};
	}
}
