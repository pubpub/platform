import { expect, test } from "@playwright/test";

test.only("Create a form", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL("/c/unjournal/stages");

	await page.goto("/c/croccroc/forms");
	await page.getByTestId("new-form-button").click();
	await page.getByRole("combobox").click();
	await page.getByRole("option", { name: "Submission" }).click();
	const formSlug = "playwright-test-form";
	await page.getByRole("textbox", { name: "name" }).fill("playwright test form");
	await page.getByRole("textbox", { name: "slug" }).fill(formSlug);
	await page.getByRole("button", { name: "Create" }).click();
	await page.waitForURL(`/c/croccroc/forms/${formSlug}/edit`);
});

test.describe("Submission buttons", () => {
	test("Add a new button and edit without saving", async ({ page }) => {
		await page.goto("/login");
		await page.getByLabel("email").fill("all@pubpub.org");
		await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
		await page.getByRole("button", { name: "Sign in" }).click();
		await page.waitForURL("/c/unjournal/stages");

		await page.goto("/c/croccroc/forms");
		await page.getByTestId("new-form-button").click();
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await page.getByRole("textbox", { name: "name" }).fill("playwright test form");
		await page.getByRole("textbox", { name: "slug" }).fill("playwright-test-form");
		await page.getByRole("button", { name: "Create" }).click();
		// await page.getByRole("combobox").click();
		// await page.getByRole("option", { name: "Jill Admin" }).click();
		// await expect(page.getByText("Success", { exact: true })).toBeVisible();
		// await page.context().storageState({ path: authFile });
	});
});
