import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("Login", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/.*\/c\/\w+\/stages.*/);
	await expect(page.getByRole("link", { name: "Workflows" })).toBeVisible();
	await page.context().storageState({ path: authFile });
});

test("Logout", async ({ page }) => {
	// should replace login with startup and and eventual db actions with teardown steps
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/.*\/c\/\w+\/stages.*/);
	await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
	await page.getByRole("button", { name: "Logout" }).click();
	await page.waitForURL("/login");
	await page.context().storageState({ path: authFile });
});
