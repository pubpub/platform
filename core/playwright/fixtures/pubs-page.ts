import type { Page } from "@playwright/test";

import type { PubsId } from "db/public";

import { getPubTitle } from "~/lib/pubs";

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
		const createDialog = this.page.getByRole("dialog", { name: "Create Pub", exact: true });
		await createDialog.waitFor();

		// disable all toggles
		const fieldToggles = createDialog.getByRole("button", {
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
				await createDialog.getByTestId(`${fullSlug}-toggle`).click();
				await createDialog.getByLabel(fullSlug).fill(value);
			}
		}

		if (pubType) {
			await createDialog.getByLabel("Select Pub Type").getByRole("button").click();
			await this.page.getByRole("menuitem", { name: pubType, exact: true }).click();
		}

		if (stage) {
			// open the stage selection popover, then select a stage
			await createDialog.getByLabel("Stage").getByRole("button").click();
			await this.page.getByRole("menuitem", { name: stage, exact: true }).click();
		}

		const submit = this.page.getByRole("button", { name: "Create Pub", exact: true });
		if (await submit.isDisabled()) {
			throw new Error("Submit button is still disabled");
		}
		await submit.click();
		await createDialog.waitFor({ state: "hidden" });

		// Kind of fragile since it depends on the default pub title and assumes this pub is the first on the page
		const pubLink = await this.page.$(`a[href^="/c/${this.communitySlug}/pubs/"]`);

		if (!pubLink) {
			throw new Error("Unable to get path from newly created pub");
		}

		const path = await pubLink.getAttribute("href");

		if (!path) {
			throw new Error("Unable to get path from newly created pub");
		}

		const pubId = path.match(/\/([0-9a-f-]+)$/)?.[1];

		if (!pubId) {
			throw new Error("Unable to get pub id from newly created pub");
		}

		return pubId as PubsId;
	}
}
