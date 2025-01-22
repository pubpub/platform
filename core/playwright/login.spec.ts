import { expect, test } from "@playwright/test";

import { LoginPage } from "./fixtures/login-page";
import { inbucketClient } from "./helpers";

test.describe("general auth", () => {
	test("Login with invalid credentials", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.login("all@pubpub.org", "pubpub-all-wrong");
		await page.getByText("Incorrect email or password", { exact: true }).waitFor();
	});
});

test.describe("Auth with lucia", () => {
	test("Login as a lucia user", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.loginAndWaitForNavigation("new@pubpub.org", "pubpub-new");
	});

	test("Logout as a lucia user", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.loginAndWaitForNavigation("new@pubpub.org", "pubpub-new");

		const cookies = await page.context().cookies();
		expect(cookies.find((cookie) => cookie.name === "auth_session")).toBeTruthy();
		expect(
			cookies.find((cookie) =>
				["token", "refresh", "sb-access-token", "sb-refresh-token"].includes(cookie.name)
			)
		).toBeFalsy();

		await page.getByRole("button", { name: "Logout" }).click();
		await page.waitForURL("/login");

		const cookiesAfterLogout = await page.context().cookies();
		expect(cookiesAfterLogout.find((cookie) => cookie.name === "session")).toBeFalsy();
	});

	test("Password reset flow for lucia user", async ({ page }) => {
		// through forgot form
		await page.goto("/forgot");
		await page.getByRole("textbox").click();
		await page.getByRole("textbox").fill("new@pubpub.org");
		await page.getByRole("button", { name: "Send reset email" }).click();
		await page.getByRole("button", { name: "Close" }).click();

		const message = await (await inbucketClient.getMailbox("new")).getLatestMessage();

		const url = message.message.body.text?.match(/(http:\/\/.*?reset)\s/)?.[1];
		await message.delete();

		if (!url) {
			throw new Error("No url found!");
		}

		await page.goto(url);

		await page.waitForURL("/reset");
		await page.getByRole("textbox").click();
		await page.getByRole("textbox").fill("new-pubpub");
		await page.getByRole("button", { name: "Set new password" }).click();

		await page.waitForURL("/login");

		// through settings
		await page.getByPlaceholder("m@example.com").click();
		await page.getByPlaceholder("m@example.com").fill("new@pubpub.org");
		await page.getByPlaceholder("m@example.com").press("Tab");
		await page.getByLabel("Password").fill("new-pubpub");
		await page.getByRole("button", { name: "Sign in" }).click();

		await page.waitForURL(/\/c\/\w+\/stages/);
		await page.getByRole("link", { name: "Settings" }).last().click();
		await page.getByRole("button", { name: "Reset" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Password reset email sent" })
		).toHaveCount(1);

		const message2 = await (await inbucketClient.getMailbox("new")).getLatestMessage();

		const url2 = message2.message.body.text?.match(/http:\/\/.*reset/)?.[0];
		await message2.delete();

		if (!url2) {
			throw new Error("No url found!");
		}

		await page.goto(url2);

		await page.waitForURL("/reset");
		// if it timesout here, the token is wrong
		await page.getByRole("textbox").click({ timeout: 1000 });
		await page.getByRole("textbox").fill("pubpub-new");
		await page.getByRole("button", { name: "Set new password" }).click();
		await page.getByPlaceholder("m@example.com").click();
		await page.getByPlaceholder("m@example.com").fill("new@pubpub.org");
		await page.getByPlaceholder("m@example.com").press("Tab");
		await page.getByLabel("Password").fill("pubpub-new");
		await page.getByRole("button", { name: "Sign in" }).click();

		await page.waitForURL(/\/c\/\w+\/stages/);
	});
});

test("Last visited community is remembered", async ({ page }) => {
	const unjournalRegex = new RegExp("/c/unjournal/");
	const croccrocRegex = new RegExp("/c/croccroc/");
	const loginPage = new LoginPage(page);

	// Login and visit default community
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation("all@pubpub.org", "pubpub-all");
	await expect(page).toHaveURL(unjournalRegex);

	// Switch communities and logout
	await page.getByRole("button", { name: "Select a community" }).click();
	await page.getByRole("menuitem", { name: "CrocCroc" }).click();
	await page.waitForURL(croccrocRegex);
	await page.getByRole("button", { name: "Logout" }).click();

	// Log back in and switched community should be remembered
	await page.waitForURL("/login");
	await loginPage.loginAndWaitForNavigation("all@pubpub.org", "pubpub-all");
	await expect(page).toHaveURL(croccrocRegex);
});
