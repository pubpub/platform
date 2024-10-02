import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { PubsPage } from "./fixtures/pubs-page";
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

test.describe("Moving a pub", () => {
	test("Can move a pub across linked stages", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goToSeededPub();
		await expect(page.getByTestId("current-stage")).toHaveText("Submitted");
		// For this initial stage, there are only destinations ,no sources
		await page.getByRole("button", { name: "Move" }).click();
		const sources = page.getByTestId("sources");
		const destinations = page.getByTestId("destinations");
		await expect(sources).toHaveCount(0);
		await destinations.getByRole("button", { name: "Ask Author For Consent" }).click();
		await expect(page.getByTestId("current-stage")).toHaveText("Ask Author for Consent");

		// Open the move modal again and expect to be able to move to sources and destinations
		await page.getByRole("button", { name: "Move" }).click();
		await expect(sources.getByRole("button", { name: "Submitted" })).toHaveCount(1);
		await expect(destinations.getByRole("button", { name: "To Evaluate" })).toHaveCount(1);
	});

	test("No move button if pub is not in a linked stage", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		await page.getByTestId("pub-dropdown-button").click();
		await page.getByRole("button", { name: "Update" }).click();
		await page.getByTestId("stage-selector").click();
		// Shelved is its own node in stages
		await page.getByRole("menuitem", { name: "Shelved" }).click();
		await page.getByRole("button", { name: "Update Pub" }).click();

		await pubsPage.goToSeededPub();
		await expect(page.getByTestId("current-stage")).toHaveText("Shelved");
		await expect(page.getByRole("button", { name: "Move" })).toHaveCount(0);
	});
});

test.describe("Creating a pub", () => {
	test("Can create a pub without a stage", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		const title = "Pub without a stage";
		await pubsPage.goTo();
		await page.getByRole("button", { name: "Create" }).click();
		await page.getByLabel("Title").fill(title);
		await page.getByLabel("Content").fill("Some content");
		await page.getByRole("button", { name: "Create Pub" }).click();
		await page.getByRole("link", { name: title }).click();
		await page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
		await expect(page.getByTestId("current-stage")).toHaveCount(0);
	});

	test("Can create a pub with a stage", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		const title = "Pub with a stage";
		const stage = "Submitted";
		await pubsPage.goTo();
		await page.getByRole("button", { name: "Create" }).click();
		await page.getByLabel("Title").fill(title);
		await page.getByLabel("Content").fill("Some content");
		await page.getByRole("button", { name: "No stage" }).click();
		await page.getByRole("menuitem", { name: stage }).click();
		await page.getByRole("button", { name: "Create Pub" }).click();
		await page.getByRole("link", { name: title }).click();
		await page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
		await expect(page.getByTestId("current-stage")).toHaveText(stage);
	});

	test("Can create a pub with no values", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		await page.getByRole("button", { name: "Create" }).click();
		await page.getByLabel("Title").fill("asdf");
		const toggles = await page.getByLabel("Toggle field").all();
		for (const toggle of toggles) {
			await toggle.click();
		}
		await page.getByRole("button", { name: "Create Pub" }).click();
		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);
	});
});
