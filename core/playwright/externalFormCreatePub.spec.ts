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
	await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:email`);
	await formEditPage.saveForm();

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

test.describe("Multivalue inputs", () => {
	test("Can add a radio and checkbox multivalue input", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		// Add a numeric array and string array
		await fieldsPage.addField("Favorite numbers", CoreSchemaType.NumericArray);
		await fieldsPage.addField("Favorite animals", CoreSchemaType.StringArray);
		// Add these to existing form
		const formEditPage = new FormsEditPage(page, COMMUNITY_SLUG, FORM_SLUG);
		await formEditPage.goto();
		await formEditPage.openAddForm();

		// Radio button group with numbers
		await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:favorite-numbers`);
		const numberElement = {
			name: "Favorite numbers",
			description: "Mine are odd, how about you?",
		};
		await page.getByTestId("component-radioGroup").click();
		await page.getByRole("textbox", { name: "Label" }).fill(numberElement.name);
		await page.getByRole("textbox", { name: "Description" }).fill(numberElement.description);
		const numbers = [0, 1, 2, 3];
		for (const number of numbers) {
			await page.getByTestId("multivalue-input").fill(`${number}`);
			await page.keyboard.press("Enter");
			await expect(page.getByTestId(`sortable-value-${number}`)).toHaveCount(1);
		}
		await formEditPage.saveFormElementConfiguration();

		// Checkbox group with strings
		await formEditPage.openAddForm();
		await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:favorite-animals`);
		const animalElement = {
			name: "Favorite animals",
			description: "Mine are furry, how about yours?",
		};
		await page.getByTestId("component-checkboxGroup").click();
		await page.getByRole("textbox", { name: "Label" }).fill(animalElement.name);
		await page.getByRole("textbox", { name: "Description" }).fill(animalElement.description);
		const animals = ["cats", "dogs", "squirrels"];
		for (const animal of animals) {
			await page.getByTestId("multivalue-input").fill(animal);
			await page.keyboard.press("Enter");
			await expect(page.getByTestId(`sortable-value-${animal}`)).toHaveCount(1);
		}
		await page.getByTestId("include-other").click();
		await formEditPage.saveFormElementConfiguration();

		// Save the form builder and go to external form
		await formEditPage.saveForm();
		await formEditPage.goToExternalForm();
		for (const element of [numberElement, animalElement]) {
			await expect(page.getByText(element.name)).toHaveCount(1);
			await expect(page.getByText(element.description)).toHaveCount(1);
		}

		// Fill out the form
		const title = "multivalue";
		await page.getByTestId(`${COMMUNITY_SLUG}:title`).fill(title);
		await page.getByTestId(`${COMMUNITY_SLUG}:content`).fill("content");
		await page.getByTestId(`${COMMUNITY_SLUG}:email`).fill("test@email.com");
		// Radio group
		await page.getByTestId("radio-0").click();
		// Checkbox group
		await page.getByTestId("checkbox-cats").click();
		await page.getByTestId("other-field").fill("otters");
		await page.getByRole("button", { name: "Submit" }).click();

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
		await page.getByRole("link", { name: title }).click();
		await expect(page.getByText(numberElement.name)).toHaveCount(1);
		await expect(page.getByTestId(`${numberElement.name}-value`)).toHaveText("0");
		await expect(page.getByText(animalElement.name)).toHaveCount(1);
		await expect(page.getByTestId(`${animalElement.name}-value`)).toHaveText("cats,otters");
	});
});
