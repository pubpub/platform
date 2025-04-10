import type { Page } from "@playwright/test";

import { inbucketClient } from "../helpers";

export class PasswordResetPage {
	constructor(public readonly page: Page) {}

	async goTo() {
		await this.page.goto(`/forgot`);
	}

	async sendResetEmail(email: string) {
		await this.page.goto("/forgot");
		await this.page.getByRole("textbox").click();
		await this.page.getByRole("textbox").fill(email);
		await this.page.getByRole("button", { name: "Send reset email" }).click();
		await this.page.getByRole("button", { name: "Close" }).click();
	}

	async goToUrlFromEmail(email: string) {
		const message = await (
			await inbucketClient.getMailbox(email.split("@")[0])
		).getLatestMessage();

		const url = message.message.body.text?.match(/(http:\/\/.*?reset)\s/)?.[1];
		await message.delete();

		if (!url) {
			throw new Error("No url found!");
		}

		await this.page.goto(url);
		await this.page.waitForURL("/reset");
	}

	async setNewPassword(newPassword: string) {
		await this.page.getByRole("textbox").click();
		await this.page.getByRole("textbox").fill(newPassword);
		await this.page.getByRole("button", { name: "Set new password" }).click();
	}
}
