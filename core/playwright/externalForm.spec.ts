import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { CoreSchemaType } from "@prisma/client";

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

	/**
	 * Fill out everything required to make an external form:
	 * 1. Fields
	 * 2. Form with fields
	 * 3. A pub
	 */
	// Populate the fields page with options
	const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
	await fieldsPage.goto();
	await fieldsPage.addFieldsOfEachType();
	// Make a form that has all these fields
	const formsPage = new FormsPage(page, COMMUNITY_SLUG);
	await formsPage.goto();
	await formsPage.addForm("Evaluation", FORM_SLUG);
	// We are automatically redirected to the form editor. Add elements!
	const formEditPage = new FormsEditPage(page, COMMUNITY_SLUG, FORM_SLUG);
	await formEditPage.openAddForm();
	// TODO: adding here is flaky when adding more than one...
	await formEditPage.addFormElement(`${COMMUNITY_SLUG}:email`);

	// Now we also need a pub! We'll use the one that automatically gets created in a community
	await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
	await page.getByRole("link", { name: "The Activity of Slugs I. The" }).click();
	await page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
	const pubId = page.url().match(/.*\/c\/.+\/pubs\/(?<pubId>.+)/)?.groups?.pubId;

	// Finally, we can go to the external form page
	await page.goto(`/c/${COMMUNITY_SLUG}/public/forms/${FORM_SLUG}/fill?pubId=${pubId}`);
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Rendering the external form", () => {
	test("Can render the form with validation", async () => {
		await expect(page.locator("h1").filter({ hasText: "Evaluation" })).toHaveCount(1);
		await page.getByTestId(`${COMMUNITY_SLUG}:email`).fill("not an email");
		await expect(
			page.locator("p").filter({ hasText: "Expected string to match 'email' format" })
		).toHaveCount(1);
		await page.getByTestId(`${COMMUNITY_SLUG}:email`).fill("test@email.com");
		await expect(
			page.locator("p").filter({ hasText: "Expected string to match 'email' format" })
		).toHaveCount(0);
	});
});
