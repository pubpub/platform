import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

const login = async ({ page }: { page: Page }) => {
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL(/\/c\/\w+\/stages/);
};
const now = new Date();
const FORM_SLUG = `playwright-test-form-${now.getTime()}`;

test.describe("Creating a form", () => {
	test.beforeEach(async ({ page }) => {
		await login({ page });
	});
	test("Create a new form for the first time", async ({ page }) => {
		await page.goto("/c/croccroc/forms");
		await page.getByRole("banner").getByTestId("new-form-button").click();
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await page.getByRole("textbox", { name: "name" }).fill(FORM_SLUG);
		await page.getByRole("textbox", { name: "slug" }).fill(FORM_SLUG);
		await page.getByRole("button", { name: "Create" }).click();
		await page.waitForURL(`/c/croccroc/forms/${FORM_SLUG}/edit`);
	});
	test("Cannot create a form with the same slug", async ({ page }) => {
		await page.goto("/c/croccroc/forms");
		await page.getByRole("banner").getByTestId("new-form-button").click();
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await page.getByRole("textbox", { name: "name" }).fill("another form");
		await page.getByRole("textbox", { name: "slug" }).fill(FORM_SLUG);
		await page.getByRole("button", { name: "Create" }).click();
		await expect(page.getByRole("status").filter({ hasText: "Error" })).toHaveCount(1);
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
		// Try a button with the same name first
		await page.getByRole("textbox", { name: "label" }).fill("Submit");
		await page.getByTestId("save-button-configuration-button").click();
		await expect(page.getByTestId("label-form-message")).toHaveText(
			"There is already a button with this label"
		);
		await page.getByRole("textbox", { name: "label" }).fill("Decline");
		await page.getByTestId("save-button-configuration-button").click();
		await page.getByTestId("button-option-Submit");
		await page.getByTestId("button-option-Decline");

		// Shouldn't be able to add more buttons
		await expect(page.getByTestId("add-submission-settings-button")).toHaveCount(0);

		// Save to the server
		await page.getByTestId("save-form-button").click();
		await expect(
			page.getByRole("status").filter({ hasText: "Form Successfully Saved" })
		).toHaveCount(1);
	});

	test("Editing a saved button", async ({ page }) => {
		const newData = { label: "Decline politely", content: "New description" };
		page.on("request", (request) => {
			if (request.method() === "POST" && request.url().includes(`forms/${FORM_SLUG}/edit`)) {
				const data = request.postDataJSON();
				const buttons = data[0].elements.filter((e) => e.type === "button");
				const declineButton = buttons.find((b) => b.label === newData.label);
				expect(declineButton.content).toEqual(newData.content);
			}
		});

		await page.goto(`/c/croccroc/forms/${FORM_SLUG}/edit`);
		await page.getByTestId("button-option-Decline").getByTestId("edit-button").click();
		await page.getByRole("textbox", { name: "label" }).fill(newData.label);
		await page.getByRole("textbox").nth(1).fill(newData.content);
		await page.getByTestId("save-button-configuration-button").click();

		await page.getByTestId("save-form-button").click();
		await expect(
			page.getByRole("status").filter({ hasText: "Form Successfully Saved" })
		).toHaveCount(1);
	});
});
