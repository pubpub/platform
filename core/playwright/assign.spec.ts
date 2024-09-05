import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("Assigning members to a pub", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();

	await page.waitForURL(/.*\/c\/\w+\/stages.*/);
	await page.getByRole("combobox").first().click();
	await page.getByRole("option", { name: "Jill Admin" }).click();
	await expect(page.getByText("Success", { exact: true })).toBeVisible();
	await page.context().storageState({ path: authFile });
});
