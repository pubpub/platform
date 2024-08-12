import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

const login = async ({ page }: { page: Page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL("/c/unjournal/stages");
};

const FORM_SLUG = "playwright-test-form";

test.describe("Creating a form", () => {
	test.beforeEach(async ({ page }) => {
		await login({ page });
	});
	test("Create a new form for the first time", async ({ page }) => {
		await page.goto("/c/croccroc/forms");
		await page.getByTestId("new-form-button").click();
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await page.getByRole("textbox", { name: "name" }).fill("playwright test form");
		await page.getByRole("textbox", { name: "slug" }).fill(FORM_SLUG);
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(`/c/croccroc/forms/${FORM_SLUG}/edit`);
	});
	test("Cannot create a form with the same slug", async ({ page }) => {
		await page.goto("/c/croccroc/forms");
		await page.getByTestId("new-form-button").click();
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await page.getByRole("textbox", { name: "name" }).fill("playwright test form");
		await page.getByRole("textbox", { name: "slug" }).fill(FORM_SLUG);
		await page.getByRole("button", { name: "Create" }).click();
		await expect(page.getByRole("status")).toContainText("Error");
	});
});

test.describe("Submission buttons", () => {
	test.beforeEach(async ({ page }) => {
		await login({ page });
	});
	test("Add a new button and edit without saving", async ({ page }) => {
		await page.goto(`/c/croccroc/forms/${FORM_SLUG}/edit`);
		await page.getByTestId("add-submission-settings-button").click();
		await page.getByTestId("save-button-configuration-button").click();
		await page.getByTestId("button-option-Submit").getByTestId("edit-button").click();
		const newButtonLabel = "Submit now";
		await page.getByRole("textbox", { name: "label" }).fill(newButtonLabel);
		await page.getByTestId("save-button-configuration-button").click();
		await page
			.getByTestId(`button-option-${newButtonLabel}`)
			.getByTestId("edit-button")
			.click();
	});
	test("Add two new buttons", async ({ page }) => {
		await page.goto(`/c/croccroc/forms/${FORM_SLUG}/edit`);
		// Add first button with default fields
		await page.getByTestId("add-submission-settings-button").click();
		await page.getByTestId("save-button-configuration-button").click();
		await page.getByTestId("button-option-Submit");

		// Add second button
		await page.getByTestId("add-submission-settings-button").click();
		await page.getByRole("textbox", { name: "label" }).fill("Decline");
		await page.getByTestId("save-button-configuration-button").click();
		await page.getByTestId("button-option-Submit");
		await page.getByTestId("button-option-Decline");

		// Shouldn't be able to add more buttons
		await expect(page.getByTestId("add-submission-settings-button")).toHaveCount(0);
	});
});
