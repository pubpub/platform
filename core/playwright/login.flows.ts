import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const login = async (page: Page, email = "new@pubpub.org", password = "pubpub-new") => {
	await page.goto("/login");
	await page.getByLabel("email").fill(email);
	await page.getByRole("textbox", { name: "password" }).fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/.*\/c\/\w+\/stages.*/);
	await expect(page.getByRole("link", { name: "Workflows" })).toBeVisible();
};
