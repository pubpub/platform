import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubsPage } from "./fixtures/pubs-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	page.on("console", async (msg) => {
		if (msg.type() === "error") {
			// eslint-disable-next-line no-console
			console.error("Error:", msg, msg.location());
		}
	});

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
	test("Can add multivalue inputs", async () => {
		// test.setTimeout(60_000);
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		// Add a numeric array and string arrays
		await fieldsPage.addField("Favorite numbers", CoreSchemaType.NumericArray);
		await fieldsPage.addField("Favorite animals", CoreSchemaType.StringArray);
		await fieldsPage.addField("Favorite fruits", CoreSchemaType.StringArray);
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
			await page.getByLabel("Radio Values").fill(`${number}`);
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
			await page.getByLabel("Checkbox Values").fill(animal);
			await page.keyboard.press("Enter");
			await expect(page.getByTestId(`sortable-value-${animal}`)).toHaveCount(1);
		}
		await page.getByTestId("include-other").click();
		await formEditPage.saveFormElementConfiguration();

		// Select dropdown with strings
		await formEditPage.openAddForm();
		await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:favorite-fruits`);
		const fruitElement = {
			name: "Favorite fruits",
			description: "Make sure it isn't a vegetable",
		};
		await page
			.getByTestId("component-selectDropdown")
			.getByText("Select Dropdown", { exact: true })
			.click();

		await page.getByRole("textbox", { name: "Label" }).fill(fruitElement.name);
		await page.getByRole("textbox", { name: "Description" }).fill(fruitElement.description);
		const fruits = ["mangos", "pineapples", "figs"];
		for (const fruit of fruits) {
			await page.getByLabel("Dropdown Values").fill(fruit);
			await page.keyboard.press("Enter");
			await expect(page.getByTestId(`sortable-value-${fruit}`)).toHaveCount(1);
		}
		await formEditPage.saveFormElementConfiguration();

		// Save the form builder and go to external form
		await formEditPage.saveForm();
		await formEditPage.goToExternalForm();
		for (const element of [numberElement, animalElement, fruitElement]) {
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
		// Select dropdown
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "mangos" }).click();
		await page.getByRole("button", { name: "Submit" }).click();
		await page.getByText("Form Successfully Submitted").waitFor();

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
		await page.getByRole("link", { name: title }).click();
		// Make sure pub details page has loaded before making assertions
		await page.getByText("Assignee").waitFor();
		await expect(page.getByText(numberElement.name)).toHaveCount(1);
		await expect(page.getByTestId(`${numberElement.name}-value`)).toHaveText("0");
		await expect(page.getByText(animalElement.name)).toHaveCount(1);
		await expect(page.getByTestId(`${animalElement.name}-value`)).toHaveText("cats,otters");
		await expect(page.getByText(fruitElement.name)).toHaveCount(1);
		await expect(page.getByTestId(`${fruitElement.name}-value`)).toHaveText("mangos");
	});
});

test.describe("Rich text editor", () => {
	test("Can edit a rich text field", async () => {
		// Add rich text field
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.addField("Rich text", CoreSchemaType.RichText);

		// Add a new form
		const formsPage = new FormsPage(page, COMMUNITY_SLUG);
		formsPage.goto();
		const formSlug = "rich-text-test";
		await formsPage.addForm("Rich text test", formSlug);

		await page.waitForURL(`/c/${COMMUNITY_SLUG}/forms/${formSlug}/edit`);

		// Add to existing form
		const formEditPage = new FormsEditPage(page, COMMUNITY_SLUG, formSlug);
		await formEditPage.goto();
		await formEditPage.openAddForm();

		// Add rich text field to form
		await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:rich-text`);
		// Save the form builder and go to external form
		await formEditPage.saveForm();
		await formEditPage.goToExternalForm();

		// Fill out the form
		const actualTitle = "rich text title";
		await page.getByTestId(`${COMMUNITY_SLUG}:title`).fill("form title");
		await page.getByTestId(`${COMMUNITY_SLUG}:content`).fill("content");
		// Rich text field
		await page.locator(".ProseMirror").click();
		await page.keyboard.type("@title");
		await page.keyboard.press("Enter");
		await page.keyboard.type(actualTitle);
		await page.getByRole("button", { name: "Submit" }).click();
		await page.getByText("Form Successfully Submitted", { exact: true }).waitFor();

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
		await expect(page.getByRole("link", { name: actualTitle })).toHaveCount(1);
	});
});

test.describe("Related pubs", () => {
	test("Can add related pubs", async () => {
		// Create a related pub we can link to
		const relatedPubTitle = "related pub";
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		await pubsPage.createPub({
			values: { title: relatedPubTitle, content: "my content" },
		});

		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		// Add a string, string array, and null related field
		const relatedFields = [
			{ name: "string", schemaName: CoreSchemaType.String },
			{ name: "array", schemaName: CoreSchemaType.StringArray },
			{ name: "null", schemaName: CoreSchemaType.Null },
		];
		for (const relatedField of relatedFields) {
			await fieldsPage.addField(relatedField.name, relatedField.schemaName, true);
		}
		// Add these to a new form
		const formSlug = "relationship-form";
		const formsPage = new FormsPage(page, COMMUNITY_SLUG);
		await formsPage.goto();
		await formsPage.addForm("relationship form", formSlug);
		const formEditPage = new FormsEditPage(page, COMMUNITY_SLUG, formSlug);
		await formEditPage.goto();

		// Configure these 3 fields
		for (const relatedField of relatedFields) {
			await formEditPage.openAddForm();
			await formEditPage.openFormElementPanel(`${COMMUNITY_SLUG}:${relatedField.name}`);
			await page.getByRole("textbox", { name: "Label" }).first().fill(relatedField.name);
			await formEditPage.saveFormElementConfiguration();
		}

		// Save the form builder and go to external form
		await formEditPage.saveForm();
		await formEditPage.goToExternalForm();
		for (const element of relatedFields) {
			await expect(page.getByText(element.name)).toHaveCount(1);
		}

		// Fill out the form
		const title = "pub with related fields";
		await page.getByTestId(`${COMMUNITY_SLUG}:title`).fill(title);
		await page.getByTestId(`${COMMUNITY_SLUG}:content`).fill("content");
		// string related field
		const stringRelated = page.getByTestId("related-pubs-string");
		await stringRelated.getByRole("button", { name: "Add" }).click();
		await page
			.getByRole("button", { name: `Select row ${relatedPubTitle}` })
			.getByLabel("Select row")
			.click();
		await page.getByTestId("add-related-pub-button").click();
		await expect(stringRelated.getByText(relatedPubTitle)).toHaveCount(1);
		await stringRelated.getByRole("button", { name: "Add string" }).click();
		await page.getByTestId(`${COMMUNITY_SLUG}:string.0.value`).fill("admin");
		// Click the button again to 'exit' the popover
		await stringRelated.getByRole("button", { name: "Add string" }).click();
		await expect(stringRelated.getByText("admin")).toHaveCount(1);

		// array related field
		const arrayRelated = page.getByTestId("related-pubs-array");
		await arrayRelated.getByRole("button", { name: "Add" }).click();
		await page
			.getByRole("button", { name: `Select row ${relatedPubTitle}` })
			.getByLabel("Select row")
			.click();
		await page.getByTestId("add-related-pub-button").click();
		await expect(arrayRelated.getByText(relatedPubTitle)).toHaveCount(1);
		await arrayRelated.getByRole("button", { name: "Add array" }).click();
		const locator = page.getByTestId(`multivalue-input`);
		/**
		 * Use 'press' to trigger the ',' keyboard event, which "adds" the value
		 * Could also use 'Enter', but this seems to trigger submitting the form when run thru playwright
		 */
		await locator.fill("one");
		await locator.press(",");
		await locator.fill("two");
		await locator.press(",");
		// Click the button again to 'exit' the popover
		await arrayRelated.getByRole("button", { name: "Add array" }).click();
		await expect(arrayRelated.getByText("one,two")).toHaveCount(1);

		// null related field
		const nullRelated = page.getByTestId("related-pubs-null");
		await nullRelated.getByRole("button", { name: "Add" }).click();
		await page
			.getByRole("button", { name: `Select row ${relatedPubTitle}` })
			.getByLabel("Select row")
			.click();
		await page.getByTestId("add-related-pub-button").click();
		await expect(nullRelated.getByText(relatedPubTitle)).toHaveCount(1);
		// Can't add a value to a null related field
		await expect(nullRelated.getByTestId("add-related-value")).toHaveCount(0);
		await page.getByRole("button", { name: "Submit" }).click();

		// Check the pub page to make sure the values we expect are there
		await page.goto(`/c/${COMMUNITY_SLUG}/pubs`);
		await page.getByRole("link", { name: title }).click();
		// Make sure pub details page has loaded before making assertions
		await page.getByText("Assignee").waitFor();
		await expect(page.getByText("admin:related pub")).toHaveCount(1);
		await expect(page.getByText("nullrelated pub")).toHaveCount(1);
	});
});
