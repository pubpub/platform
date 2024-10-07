import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { createCommunity, login } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	await login({ page });
	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	// this seems necessary
	await page.waitForTimeout(1000);
	/**
	 * Fill out everything required to make an external form:
	 * 1. Fields
	 * 2. Form with fields
	 */
	// Add email field
	const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
	await fieldsPage.goto();
	await fieldsPage.addField("email", CoreSchemaType.Email);
	// Make a form (by default has title and content)
	const formsPage = new FormsPage(page, COMMUNITY_SLUG);
	await formsPage.goto();
	await formsPage.addForm("Evaluation", FORM_SLUG);
	// We are automatically redirected to the form editor. Add email element
	const formEditPage = new FormsEditPage(page, COMMUNITY_SLUG, FORM_SLUG);
	await formEditPage.openAddForm();
	await formEditPage.addFormElement(`${COMMUNITY_SLUG}:email`);

	// Go to the external form page
	await page.goto(`/c/${COMMUNITY_SLUG}/public/forms/${FORM_SLUG}/fill`);
});

test.afterAll(async () => {
	await page.close();
});

test("Can create a pub from an external form", async () => {
	const title = "new pub";
	await expect(page.locator("h1").filter({ hasText: "Evaluation" })).toHaveCount(1);
	await page.getByTestId(`${COMMUNITY_SLUG}:title`).fill(title);
	await page.getByTestId(`${COMMUNITY_SLUG}:content`).fill("new content");
	await page.getByTestId(`${COMMUNITY_SLUG}:email`).fill("test@email.com");
	await page.getByRole("button", { name: "Submit" }).click();
	await expect(page.getByTestId("completed")).toHaveCount(1);

	// Check the pub page that this pub was created
	await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
	await expect(page.getByRole("link", { name: title })).toHaveCount(1);
});
