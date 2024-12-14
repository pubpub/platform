import type { Page } from "@playwright/test";

import type { PubsId } from "db/public";

export const choosePubType = async ({
	page,
	pubType,
	communitySlug,
}: {
	page: Page;
	pubType?: string;
	communitySlug: string;
}) => {
	const createDialog = page.getByRole("dialog", { name: "Create Pub", exact: true });
	await createDialog.waitFor();

	// Choose a pub type
	await createDialog.getByLabel("Pub type").click();
	if (pubType) {
		await page.getByRole("option", { name: pubType, exact: true }).click();
	} else {
		// Choose the first pub type
		await page.getByRole("option").first().click();
	}
	await createDialog.getByRole("button", { name: "Create Pub" }).click();
	await page.waitForURL(`/c/${communitySlug}/pubs/create**`);
};

export class PubsPage {
	private readonly communitySlug: string;

	constructor(
		public readonly page: Page,
		communitySlug: string
	) {
		this.communitySlug = communitySlug;
	}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/pubs`);
	}

	async choosePubType(pubType?: string) {
		await choosePubType({ page: this.page, pubType, communitySlug: this.communitySlug });
	}

	async createPub({
		pubType,
		stage,
		values,
	}: {
		pubType?: string;
		stage?: string;
		values?: Record<string, string>;
	}) {
		await this.page.getByRole("button", { name: "Create", exact: true }).click();
		await this.choosePubType(pubType);

		// disable all toggles
		const fieldToggles = this.page.getByRole("button", {
			name: "Toggle field",
			pressed: true,
			exact: true,
		});

		// .all() doesn't work here because the list of matching elements changes as they're toggled
		for (const toggle of await fieldToggles.elementHandles()) {
			await toggle.click();
		}

		// TODO: this will only really work for text/numbers
		if (values) {
			for (const [slug, value] of Object.entries(values)) {
				const fullSlug = `${this.communitySlug}:${slug}`;
				// toggle the field on
				await this.page.getByTestId(`${fullSlug}-toggle`).click();
				await this.page.getByTestId(fullSlug).fill(value);
			}
		}

		if (stage) {
			// open the stage selection popover, then select a stage
			await this.page.getByLabel("Stage").click();
			await this.page.getByRole("option", { name: stage, exact: true }).click();
		}

		await this.page.getByRole("button", { name: "Save", exact: true }).click();
		await this.page.waitForURL(`/c/${this.communitySlug}/pubs/*/edit?*`);
		const pubId = this.page.url().match(/.*\/c\/.+\/pubs\/(?<pubId>.+)\/edit/)?.groups?.pubId;

		if (!pubId) {
			throw new Error("Unable to get pub id from newly created pub");
		}

		return pubId as PubsId;
	}
}
