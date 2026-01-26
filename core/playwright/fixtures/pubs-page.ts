import type { Page } from "@playwright/test"
import type { PubsId } from "db/public"

import { retryAction } from "../helpers"

export const choosePubType = async ({
	page,
	pubType,
	communitySlug,
}: {
	page: Page
	pubType?: string
	communitySlug: string
}) => {
	const createDialog = page.getByRole("dialog", { name: "Create Pub", exact: true })
	await createDialog.waitFor({ state: "visible", timeout: 5000 })

	// Choose a pub type
	await createDialog.getByLabel("Pub type").click({ timeout: 5000 })
	if (pubType) {
		await page.getByRole("option", { name: pubType, exact: true }).click({ timeout: 5000 })
	} else {
		// Choose the first pub type
		await page.getByRole("option").first().click({ timeout: 5000 })
	}

	await retryAction(async () => {
		await page.waitForTimeout(500)
		await createDialog
			.getByRole("button", { name: /Create Pub|Redirecting/ })
			.click({ timeout: 5000 })
		await page.waitForURL(`/c/${communitySlug}/pubs/create**`, { timeout: 3000 })
	})
}

export class PubsPage {
	private readonly communitySlug: string

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug
	}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/pubs`)
	}

	async createPub({
		pubType,
		stage,
		values,
	}: {
		pubType?: string
		stage?: string
		values?: Record<string, string>
	}) {
		await this.page.waitForURL(`/c/${this.communitySlug}/pubs*`)
		// this is extremely flaky for some reason
		await retryAction(async () => {
			await this.page.waitForTimeout(1000)
			await this.page
				.getByRole("button", { name: "Create", exact: true })
				.click({ timeout: 5000 })
			await this.page
				.getByRole("heading", { name: "Create Pub", exact: true })
				.waitFor({ state: "visible", timeout: 5000 })
			await this.page.waitForTimeout(500)
			await choosePubType({ page: this.page, pubType, communitySlug: this.communitySlug })
		})

		await this.page.waitForTimeout(500)

		// disable all toggles
		const fieldToggles = this.page.getByRole("button", {
			name: "Toggle field",
			pressed: true,
			exact: true,
		})

		await this.page.waitForTimeout(1000)
		// .all() doesn't work here because the list of matching elements changes as they're toggled
		for (const toggle of await fieldToggles.elementHandles()) {
			await toggle.click()
		}

		// TODO: this will only really work for text/numbers
		if (values) {
			for (const [slug, value] of Object.entries(values)) {
				const fullSlug = `${this.communitySlug}:${slug}`
				// toggle the field on
				await this.page.getByTestId(`${fullSlug}-toggle`).click()
				await this.page.getByTestId(fullSlug).fill(value)
			}
		}

		if (stage) {
			// open the stage selection popover, then select a stage
			await this.page.getByLabel("Stage").click()
			await this.page.getByRole("option", { name: stage, exact: true }).click()
		}

		await this.page.getByRole("button", { name: "Save", exact: true }).click()
		await this.page.waitForURL(`/c/${this.communitySlug}/pubs/*/edit?*`)
		const pubId = this.page.url().match(/.*\/c\/.+\/pubs\/(?<pubId>.+)\/edit/)?.groups?.pubId

		if (!pubId) {
			throw new Error("Unable to get pub id from newly created pub")
		}

		return pubId as PubsId
	}
}
