import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { PubsPage } from "./fixtures/pubs-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

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
	await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:email`);
	await formEditPage.saveForm();

	// Now we also need a pub!
	const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
	await pubsPage.goTo();
	const pubId = await pubsPage.createPub({
		pubType: "Submission",
		values: { title: "The Activity of Slugs" },
	});

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
		await expect(page.locator("p").filter({ hasText: "Invalid email address" })).toHaveCount(1);
		await page.getByTestId(`${COMMUNITY_SLUG}:email`).fill("test@email.com");
		await expect(page.locator("p").filter({ hasText: "Invalid email address" })).toHaveCount(0);
	});

	test("Can save a subset of a pub's values", async () => {
		// Create a pub with Title and Content
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		const values = { title: "I have a title and content", content: "My content" };
		const pubId = await pubsPage.createPub({
			pubType: "Submission",
			values,
		});

		// Add a pub type that only has Title. This will create a default form title-default-form
		const pubTypePage = new PubTypesPage(page, COMMUNITY_SLUG);
		await pubTypePage.goto();
		await pubTypePage.addType("Title", "title only", ["title"]);
		const formSlug = "title-default-editor";
		await page.goto(`/c/${COMMUNITY_SLUG}/public/forms/${formSlug}/fill?pubId=${pubId}`);

		// Update the title
		const newTitle = "New title";
		await page.getByTestId(`${COMMUNITY_SLUG}:title`).fill(newTitle);
		// There should not be a Content field
		await expect(page.getByTestId(`${COMMUNITY_SLUG}:content`)).toHaveCount(0);
		await page.getByRole("button", { name: "Submit" }).click();
		await expect(page.getByTestId("completed")).toHaveCount(1);

		// Visit the pub's page
		const pubPage = new PubDetailsPage(page, COMMUNITY_SLUG, pubId);
		await pubPage.goTo();
		await expect(page.getByTestId(`Content-value`)).toHaveText(values.content);
		await expect(page.getByRole("heading", { name: "New title" })).toHaveCount(1);
	});
});
