import type { Locator, Page } from "@playwright/test";

export class FormsEditPage {
	private readonly communitySlug: string;
	private readonly formSlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string,
		formSlug: string
	) {
		this.communitySlug = communitySlug;
		this.formSlug = formSlug;
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/forms/${this.formSlug}/edit`);
	}

	async openAddForm() {
		await this.page.getByRole("button", { name: "Add New" }).click();
	}

	async addFormElement(slug: string) {
		await this.page.getByTestId(`field-button-${slug}`).click();
		await this.saveForm();
	}

	async saveForm() {
		await this.page.getByTestId("save-form-button").click();
	}
}
