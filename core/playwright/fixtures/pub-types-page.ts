import type { Page } from "@playwright/test"
import type { PubTypesId } from "db/public"

export class PubTypesPage {
	private readonly communitySlug: string

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/types`)
	}

	async addType<T extends string>(
		name: string,
		description: string,
		slugs?: T[]
		// title?: T
	) {
		await this.page.getByRole("button", { name: "Create Type" }).click()
		await this.page.getByRole("textbox", { name: "Type Name" }).fill(name)
		await this.page.getByRole("textbox", { name: "Description" }).click()
		await this.page.getByRole("textbox", { name: "Description" }).fill(description)
		await this.page.getByRole("button", { name: "Select options" }).click()

		if (!slugs) {
			const options = await this.page.getByRole("option").all()

			for (const [index, option] of options.entries()) {
				if (index !== 0) {
					await option.click()
				}
			}
		} else {
			for (const slug of slugs) {
				const option = this.page.getByRole("option", { name: slug })
				await option.click()
			}
		}

		await this.page.getByRole("button", { name: "Create", exact: true }).click()

		await this.page.waitForURL(`/c/${this.communitySlug}/types/*/edit*`)

		const typeId = this.page.url()
		const id = typeId.split("/").at(-2)

		return {
			name,
			id: id! as PubTypesId,
		}
	}
}
