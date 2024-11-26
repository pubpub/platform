import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { LoginPage } from "./fixtures/login-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	test.setTimeout(30_000);
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Creating a field", () => {
	test("Can create a new field of each type", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.addFieldsOfEachType();
		for (const [index, schema] of Object.values(CoreSchemaType)
			.filter((s) => s !== CoreSchemaType.Null)
			.entries()) {
			// Need to go to the next page at this point to see the remaining fields...
			if (index === 8) {
				await page.getByRole("button", { name: "Go to next page" }).click();
			}
			await expect(
				page.getByRole("button", { name: `Select row ${schema} ${schema}` })
			).toHaveCount(1);
		}

		// Try to create a field with the same name, should error
		await fieldsPage.addField("String", CoreSchemaType.String);
		await expect(page.getByRole("status").filter({ hasText: "Error" })).toHaveCount(1);
	});

	test("Auto slug", async () => {
		const fieldName = "test name";
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.openNewFieldModal();
		await page.getByRole("textbox", { name: "name" }).fill(fieldName);
		await expect(page.getByRole("textbox", { name: "slug" })).toHaveValue("test-name");

		// Can change slug name without field name changing
		await page.getByRole("textbox", { name: "slug" }).fill("different slug");
		await expect(page.getByRole("textbox", { name: "name" })).toHaveValue(fieldName);
		// But this slug has spaces so should error
		await page.getByRole("button", { name: "Create" }).click();
		await expect(
			page.locator("p").filter({ hasText: "Slug must not have spaces" })
		).toHaveCount(1);
		// Fix the slug name
		await page.getByRole("textbox", { name: "slug" }).fill("different-slug");
		await expect(
			page.locator("p").filter({ hasText: "Slug must not have spaces" })
		).toHaveCount(0);

		// Change the field name again and the slug should change too
		await page.getByRole("textbox", { name: "name" }).fill("another test name");
		await expect(page.getByRole("textbox", { name: "slug" })).toHaveValue("another-test-name");
	});

	test("Schema is only required if field is not a relationship field", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.openNewFieldModal();
		await page.getByRole("textbox", { name: "name" }).fill("Relation field");
		await page.getByRole("button", { name: "Create" }).click();
		await expect(page.getByTestId("schema-select-form-message")).toHaveText(
			"Please select a schema type for this field"
		);

		// Mark that this field isRelation, then the format should no longer be required
		// and the submission should go through with default Null schema
		await page.getByTestId("isRelation-checkbox").click();
		await page.getByRole("button", { name: "Create" }).click();
		await expect(page.getByTestId("schema-select-form-message")).toHaveCount(0);

		await page.getByRole("button", { name: "Updated" }).click();
		await page.getByRole("menuitem", { name: "Desc" }).click();
		const newRow = page.getByRole("button", { name: "Select row Relation field" });
		await expect(newRow).toHaveCount(1);
		await expect(newRow).toContainText("Null");
	});

	test("Schema can be selected for a relationship field", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.openNewFieldModal();
		const name = "Boolean relation field";
		await page.getByRole("textbox", { name: "name" }).fill(name);
		await page.getByTestId("isRelation-checkbox").click();
		await fieldsPage.selectFormat(CoreSchemaType.Boolean);
		await page.getByRole("button", { name: "Create" }).click();

		await page.getByRole("button", { name: "Updated" }).click();
		await page.getByRole("menuitem", { name: "Desc" }).click();
		const newRow = page.getByRole("button", { name: `Select row ${name}` });
		await expect(newRow).toHaveCount(1);
		await expect(newRow).toContainText("Boolean");
	});
});

test.describe("Editing a field", () => {
	test("Can edit a field's name only", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await page.getByRole("button", { name: "Select row Title String" }).click();
		await expect(page.getByRole("dialog").getByRole("combobox")).toBeDisabled();
		await expect(page.getByRole("textbox", { name: "slug" })).toBeDisabled();
		await expect(page.getByTestId("isRelation-checkbox")).toBeDisabled();
		await page.getByRole("textbox", { name: "name" }).fill("New Title");
		await page.getByRole("button", { name: "Update" }).click();

		await page.getByRole("button", { name: "Updated" }).click();
		await page.getByRole("menuitem", { name: "Desc" }).click();
		await expect(page.getByRole("button", { name: `Select row New Title String` })).toHaveCount(
			1
		);
	});
});
