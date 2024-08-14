import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { createCommunity, login } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	await login({ page });
	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Creating a field", () => {
	test("Create a new field", async () => {
		const fieldName = "Likes dogs";
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.addField(fieldName, CoreSchemaType.Boolean);
		await expect(
			page.getByRole("button", { name: `Select row ${fieldName} Boolean` })
		).toHaveCount(1);

		// Try to create a field with the same name, should error
		await fieldsPage.addField(fieldName, CoreSchemaType.String);
		await expect(page.getByRole("status").filter({ hasText: "Error" })).toHaveCount(1);
	});
});
