import type { Page } from "@playwright/test"

import type { PubsId } from "db/public"

export class PubDetailsPage {
	constructor(
		public readonly page: Page,
		private readonly communitySlug: string,
		private readonly pubId: PubsId
	) {}

	async goTo() {
		await this.page.goto(`/c/${this.communitySlug}/pubs/${this.pubId}`)
	}
}
