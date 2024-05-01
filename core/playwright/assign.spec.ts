import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("Assigning members to a pub", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	// Wait until the page receives the cookies.
	//
	// Sometimes login flow sets cookies in the process of several redirects.
	// Wait for the final URL to ensure that the cookies are actually set.
	await page.waitForURL("/c/unjournal/stages");
	await page.getByRole("combobox").click();
	await page.getByRole("option", { name: "Jill Admin" }).click();
	await page.getByText("Success", { exact: true });
	await page.context().storageState({ path: authFile });
});
