import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity, login } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;
let pubId: PubsId;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	await login({ page });
	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const stagesManagePage = new StagesManagePage(page, COMMUNITY_SLUG);
	await stagesManagePage.goTo();
	await stagesManagePage.addStage("Shelved");
	await stagesManagePage.addStage("Submitted");
	await stagesManagePage.addStage("Ask Author for Consent");
	await stagesManagePage.addStage("To Evaluate");

	await stagesManagePage.addMoveConstraint("Submitted", "Ask Author for Consent");
	await stagesManagePage.addMoveConstraint("Ask Author for Consent", "To Evaluate");

	const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
	await pubsPage.goTo();
	pubId = await pubsPage.createPub({
		stage: "Submitted",
		values: { title: "The Activity of Snails", content: "Mostly crawling" },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Moving a pub", () => {
	test("Can move a pub across linked stages", async () => {
		const pubDetailsPage = new PubDetailsPage(page, COMMUNITY_SLUG, pubId);
		await pubDetailsPage.goTo();
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
		await page.getByTestId("pub-dropdown-button").first().click();
		await page.getByRole("button", { name: "Update" }).click();
		await page.getByTestId("stage-selector").click();
		// Shelved is its own node in stages
		await page.getByRole("menuitem", { name: "Shelved" }).click();
		await page.getByRole("button", { name: "Update Pub" }).click();
		await page.getByRole("dialog", { name: "Update Pub" }).waitFor({ state: "hidden" });

		const pubDetailsPage = new PubDetailsPage(page, COMMUNITY_SLUG, pubId);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveText("Shelved");
		await expect(page.getByRole("button", { name: "Move" })).toHaveCount(0);
	});
});

test.describe("Creating a pub", () => {
	test("Can create a pub without a stage", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		const title = "Pub without a stage";
		await pubsPage.goTo();
		await pubsPage.createPub({ values: { title, content: "Some content" } });
		await page.getByRole("link", { name: title }).click();
		await page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
		await expect(page.getByTestId("current-stage")).toHaveCount(0);
	});

	test("Can create a pub with a stage", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		const title = "Pub with a stage";
		const stage = "Submitted";
		await pubsPage.goTo();
		const pubId = await pubsPage.createPub({
			stage,
			values: { title, content: "Some content" },
		});
		const pubDetailsPage = new PubDetailsPage(page, COMMUNITY_SLUG, pubId);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveText(stage);
	});

	test("Can create a pub with no values", async () => {
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		await pubsPage.createPub({});

		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);
	});

	test("Can create and edit a multivalue field", async () => {
		// Add a multivalue field
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.addField("Animals", CoreSchemaType.StringArray);

		// Add it as a pub type
		const pubTypePage = new PubTypesPage(page, COMMUNITY_SLUG);
		await pubTypePage.goto();
		await pubTypePage.addFieldToPubType("Submission", "animals");

		// Now create a pub of this type
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		const title = "pub with multivalue";
		await page.getByRole("button", { name: "Create" }).click();
		await page.getByLabel("Title").fill(title);
		await page.getByLabel("Content").fill("Some content");
		await page.getByLabel("Animals").fill("dogs");
		await page.keyboard.press("Enter");
		await page.getByLabel("Animals").fill("cats");
		await page.keyboard.press("Enter");
		await page.getByRole("button", { name: "Create Pub" }).click();
		await page.getByRole("link", { name: title }).click();
		await page.waitForURL(/.*\/c\/.+\/pubs\/.+/);
		const pubId = page.url().match(/.*\/c\/.+\/pubs\/(?<pubId>.+)/)?.groups?.pubId;
		await expect(page.getByTestId(`Animals-value`)).toHaveText("dogs,cats");

		// Edit this same pub
		await pubsPage.goTo();
		await page.getByTestId("pub-dropdown-button").first().click();
		await page.getByRole("button", { name: "Update" }).click();
		await page.getByLabel("Animals").fill("penguins");
		await page.keyboard.press("Enter");
		await page.getByTestId("remove-button").first().click();
		await page.getByRole("button", { name: "Update Pub" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);
		await page.goto(`/c/${COMMUNITY_SLUG}/pubs/${pubId}`);
		await expect(page.getByTestId(`Animals-value`)).toHaveText("cats,penguins");
	});

	test("Can create and edit a rich text field", async () => {
		// Add a multivalue field
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG);
		await fieldsPage.goto();
		await fieldsPage.addField("Rich text", CoreSchemaType.RichText);

		// Add it as a pub type
		const pubTypePage = new PubTypesPage(page, COMMUNITY_SLUG);
		await pubTypePage.goto();
		await pubTypePage.addType("Editor", "editor", ["title", "rich-text"]);

		// Now create a pub of this type
		const actualTitle = "new title";
		const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
		await pubsPage.goTo();
		await page.getByRole("button", { name: "Create" }).click();
		await page.getByRole("button", { name: "Submission" }).click();
		await page.getByRole("menuitem", { name: "Editor" }).click();
		// Need to toggle this to enabled because of bug: https://github.com/pubpub/platform/issues/776
		await page.getByTestId(`${COMMUNITY_SLUG}:rich-text-toggle`).click();
		await page.getByLabel("Title").fill("old title");
		// It seems for ProseMirror, Keyboard actions trigger things better than using .fill()
		await page.locator(".ProseMirror").click();
		await page.keyboard.type("@title");
		await page.keyboard.press("Enter");
		await page.keyboard.type(actualTitle);
		await page.getByRole("button", { name: "Create Pub" }).click();
		await expect(page.getByRole("link", { name: actualTitle })).toHaveCount(1);

		// Now update
		await page.getByTestId("pub-dropdown-button").first().click();
		await page.getByRole("button", { name: "Update" }).click();
		await page.locator(".ProseMirror").click();
		await page.keyboard.type("prefix ");

		await page.getByRole("button", { name: "Update Pub" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);
		await pubsPage.goTo();
		await expect(page.getByRole("link", { name: `prefix ${actualTitle}` })).toHaveCount(1);
	});
});
