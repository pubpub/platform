import type { Page } from "@playwright/test";

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

	async goToExternalForm() {
		await this.page.goto(`/c/${this.communitySlug}/public/forms/${this.formSlug}/fill`);
	}

	async openAddForm() {
		await this.page.getByRole("button", { name: "Add New" }).click();
	}

	async openFormElementPanel(slug: string) {
		await this.page.getByTestId(`field-button-${slug}`).click();
	}

	async saveFormElementConfiguration() {
		await this.page.getByTestId("save-configuration-button").click();
	}

	async saveForm() {
		await this.page.getByTestId("save-form-button").click();
		await this.page.getByText("Form Successfully Saved", { exact: true }).waitFor();
		await this.page.waitForTimeout(1000);
	}
}
