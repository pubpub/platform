import type { Page } from "@playwright/test";

import { pubPath } from "~/lib/paths";

export class PubDetailsPage {
	constructor(
		public readonly page: Page,
		private readonly communitySlug: string,
		private readonly pubSlug: string
	) {}

	async goTo() {
		await this.page.goto(pubPath(this.communitySlug, this.pubSlug));
	}
}
