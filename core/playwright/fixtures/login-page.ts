import type { Page } from "@playwright/test";

export class LoginPage {
	constructor(public readonly page: Page) {}

	async goto() {
		await this.page.goto("/login");
	}

	async login(email = "all@pubpub.org", password = "pubpub-all") {
		await this.page.getByLabel("email").fill(email);
		await this.page.getByRole("textbox", { name: "password" }).fill(password);
		await this.page.getByRole("button", { name: "Sign in" }).click();
	}

	async loginAndWaitForNavigation(email = "all@pubpub.org", password = "pubpub-all") {
		await this.login(email, password);
		await this.page.waitForURL(/.*\/c\/.+\/stages.*/);
	}
}
