import type { Page } from "@playwright/test"
import type { PubTypesId } from "db/public"

export class PubTypesEditPage {
	private readonly communitySlug: string
	private readonly pubTypeId: PubTypesId

	constructor(
		public readonly page: Page,
		communitySlug: string,
		pubTypeId: PubTypesId
	) {
		this.communitySlug = communitySlug
		this.pubTypeId = pubTypeId
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/types/${this.pubTypeId}/edit`)
	}

	async openAddField() {
		await this.page.getByTestId("add-field-button").click()
	}

	async addField(name: string) {
		const addFieldButton = this.page.getByTestId("add-field-button")

		if (await addFieldButton.isVisible()) {
			await addFieldButton.click()
		}

		await this.page.getByTestId(`field-button-${name}`).click()
	}

	async saveType() {
		await this.page.getByTestId("save-form-button").click()
		await this.page.getByText("Type Successfully Saved", { exact: true }).waitFor()
	}

	async deleteField(name: string) {
		await this.page.getByTestId(`delete-${name}`).click()
	}

	async restoreField(name: string) {
		await this.page.getByTestId(`restore-${name}`).click()
	}

	async setAsTitleField(name: string) {
		await this.page.getByTestId(`set-as-title-${name}`).click()
	}

	async toggleDeleteType() {
		await this.page.getByTestId("delete-type-button").click()
	}
}
