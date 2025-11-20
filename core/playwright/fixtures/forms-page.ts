import type { Page } from "@playwright/test"

import { retryAction } from "../helpers"

export class FormsPage {
	private readonly communitySlug: string

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug
	}

	async goto() {
		await this.page.goto(`/c/${this.communitySlug}/forms`)
	}

	async addForm(name: string, slug: string, wait = true) {
		await retryAction(async () => {
			await this.page.getByRole("banner").getByTestId("new-form-button").click({
				timeout: 1_000,
			})
			await this.page.getByRole("combobox").click({
				timeout: 1_000,
			})
		})
		await this.page.getByRole("option", { name: "Submission" }).click()
		await this.page.getByRole("textbox", { name: "name" }).fill(name)
		await this.page.getByRole("textbox", { name: "slug" }).fill(slug)
		await this.page.getByRole("button", { name: "Create" }).click()

		if (!wait) {
			return
		}
		await this.page.waitForURL(`/c/${this.communitySlug}/forms/${slug}/edit`)
	}
}
