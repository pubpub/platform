import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("Login", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();

	// Wait until the page receives the cookies.
	//
	// Sometimes login flow sets cookies in the process of several redirects.
	// Wait for the final URL to ensure that the cookies are actually set.
	await page.waitForURL("/c/unjournal/stages");
	await expect(page.getByRole("link", { name: "Stages" })).toBeVisible();
	// End of authentication steps.
	await page.context().storageState({ path: authFile });
});

test("Logout", async ({ page }) => {
	// Perform authentication steps. Replace these actions with your own.
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	// Wait until the page receives the cookies.
	//
	// Sometimes login flow sets cookies in the process of several redirects.
	// Wait for the final URL to ensure that the cookies are actually set.
	await page.waitForURL("/c/unjournal/stages");
	await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
	await page.getByRole("button", { name: "Logout" }).click();
	await page.waitForURL("/login");
	await page.context().storageState({ path: authFile });
});
