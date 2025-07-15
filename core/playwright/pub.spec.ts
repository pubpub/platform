import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { choosePubType, PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";

test.describe.configure({ mode: "serial" });

let page: Page;
const seed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	users: {
		admin: {
			password: "password",
			role: MemberRole.admin,
		},
	},
	stages: {
		Shelved: {},
		Submitted: {},
		"Ask Author for Consent": {},
		"To Evaluate": {},
	},
	stageConnections: {
		Submitted: {
			to: ["Ask Author for Consent"],
		},
		"Ask Author for Consent": {
			to: ["To Evaluate"],
		},
	},
	pubs: [
		{
			pubType: "Submission",
			stage: "Submitted",
			values: { Title: "The Activity of Snails", content: "Mostly crawling" },
		},
	],
});

let community: CommunitySeedOutput<typeof seed>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Moving a pub", () => {
	test("Can move a pub across linked stages", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveText("Submitted");
		// For this initial stage, there are only destinations ,no sources
		await page.getByRole("button", { name: "Submitted", exact: true }).click();
		const sources = page.getByTestId("sources");
		const destinations = page.getByTestId("destinations");
		await expect(sources).toHaveCount(0);
		await destinations.getByRole("button", { name: "Ask Author For Consent" }).click();
		await expect(page.getByTestId("current-stage")).toHaveText("Ask Author for Consent");

		// Open the move modal again and expect to be able to move to sources and destinations
		await page.getByRole("button", { name: "Ask Author for Consent", exact: true }).click();
		await expect(sources.getByRole("button", { name: "Submitted" })).toHaveCount(1);
		await expect(destinations.getByRole("button", { name: "To Evaluate" })).toHaveCount(1);
	});

	test("No move button if pub is not in a linked stage", async () => {
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		await page.getByRole("link", { name: "Update" }).click();
		await page.getByLabel("Stage").click();
		// Shelved is its own node in stages
		await page.getByRole("option", { name: "Shelved" }).click();
		await page.getByRole("button", { name: "Save" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);

		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveText("Shelved");
		await page.getByRole("button", { name: "Shelved", exact: true }).click();
		const sources = page.getByTestId("sources");
		const destinations = page.getByTestId("destinations");
		await expect(sources).toHaveCount(0);
		await expect(destinations).toHaveCount(0);
		await expect(page.getByRole("button", { name: "View Stage", exact: true })).toHaveCount(1);
	});
});

test.describe("Creating a pub", () => {
	test("Can create a pub without a stage", async () => {
		const pubsPage = new PubsPage(page, community.community.slug);
		const title = "Pub without a stage";
		await pubsPage.goTo();
		const pubId = await pubsPage.createPub({ values: { title, content: "Some content" } });
		const pubDetailsPage = new PubDetailsPage(page, community.community.slug, pubId);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveCount(0);
	});

	test("Can create a pub with a stage", async () => {
		const pubsPage = new PubsPage(page, community.community.slug);
		const title = "Pub with a stage";
		const stage = "Submitted";
		await pubsPage.goTo();
		const pubId = await pubsPage.createPub({
			stage,
			values: { title, content: "Some content" },
		});
		const pubDetailsPage = new PubDetailsPage(page, community.community.slug, pubId);
		await pubDetailsPage.goTo();
		await expect(page.getByTestId("current-stage")).toHaveText(stage);
	});

	test("Can create a pub with no values", async () => {
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		await pubsPage.createPub({});

		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);
	});

	test("Can create and edit a multivalue field", async () => {
		// Add a multivalue field
		const fieldsPage = new FieldsPage(page, community.community.slug);
		await fieldsPage.goto();
		await fieldsPage.addField("Animals", CoreSchemaType.StringArray);

		// Add it to the default form
		const formEditPage = new FormsEditPage(
			page,
			community.community.slug,
			"submission-default-editor"
		);
		await formEditPage.goto();
		await formEditPage.openAddForm();
		await formEditPage.openFormElementPanel(`${community.community.slug}:animals`);
		await formEditPage.saveForm();

		// Now create a pub using this form
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		const title = "pub with multivalue";
		await page.getByRole("button", { name: "Create" }).click();
		await pubsPage.choosePubType("Submission");
		await page.getByLabel("Title").fill(title);
		await page.getByLabel("Content").fill("Some content");
		await page.getByLabel("Animals").fill("dogs");
		await page.keyboard.press("Enter");
		await page.getByLabel("Animals").fill("cats");
		await page.keyboard.press("Enter");
		await page.getByRole("button", { name: "Save" }).click();

		await page.waitForURL(`/c/${community.community.slug}/pubs/*/edit?*`);
		await page.getByRole("link", { name: "View Pub" }).click();
		await expect(page.getByTestId(`Animals-value`)).toHaveText("dogs,cats");

		// Edit this same pub
		await page.getByRole("link", { name: "Update" }).click();
		await page.getByLabel("Animals").fill("penguins");
		await page.keyboard.press("Enter");
		await page.getByTestId("remove-button").first().click();
		await page.getByRole("button", { name: "Save" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);
		await page.getByRole("link", { name: "View Pub" }).click();
		await expect(page.getByTestId(`Animals-value`)).toHaveText("cats,penguins");
	});

	test("Can create and edit a rich text field", async () => {
		// Add a rich text field
		const fieldsPage = new FieldsPage(page, community.community.slug);
		await fieldsPage.goto();
		await fieldsPage.addField("Rich text", CoreSchemaType.RichText);

		// Add it as a pub type
		const pubTypePage = new PubTypesPage(page, community.community.slug);
		await pubTypePage.goto();
		await pubTypePage.addType("Editor", "editor", ["title", "rich-text"], "title");

		// Now create a pub of this type
		const actualTitle = "new title";
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		await page.getByRole("button", { name: "Create" }).click();
		await pubsPage.choosePubType("Editor");
		await page.getByLabel("Title").fill("old title");
		// It seems for ProseMirror, Keyboard actions trigger things better than using .fill()
		await page.locator(".ProseMirror").click();
		await page.keyboard.type("@title");
		await page.keyboard.press("Enter");
		await page.keyboard.type(actualTitle);
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);
		await pubsPage.goTo();
		await expect(page.getByRole("link", { name: actualTitle })).toHaveCount(1);

		// Now update
		await page.getByRole("link", { name: "Update" }).first().click();
		await page.locator(".ProseMirror").click();
		// move the cursor to the beginning of the editor
		await page.keyboard.press("Home");
		await page.keyboard.type("prefix ");

		await page.getByRole("button", { name: "Save" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);
		await pubsPage.goTo();
		await expect(page.getByRole("link", { name: `prefix ${actualTitle}` })).toHaveCount(1);
	});

	test("Can create a related pub", async () => {
		// Add a related string field
		const stringField = "related-string";
		const fieldsPage = new FieldsPage(page, community.community.slug);
		await fieldsPage.goto();
		await fieldsPage.addField(stringField, CoreSchemaType.String, true);
		const pubTypePage = new PubTypesPage(page, community.community.slug);
		await pubTypePage.goto();
		await pubTypePage.addFieldToPubType(
			"Submission",
			`${community.community.slug}:${stringField}`
		);

		// Now go to a pub page and add a related pub
		const pubPage = new PubDetailsPage(page, community.community.slug, community.pubs[0].id);
		await pubPage.goTo();
		await expect(page.getByTestId("related-pubs").getByRole("table")).toContainText(
			"No results."
		);
		await page.getByRole("button", { name: "Add Related Pub" }).click();

		// Choose a pub type
		const createDialog = page.getByRole("dialog", { name: "Create Pub", exact: true });
		await createDialog.waitFor();
		await createDialog.getByLabel("Pub type").click();
		await page.getByRole("option", { name: "Submission" }).click();
		await expect(page.getByRole("button", { name: "Create Pub" })).toBeDisabled();

		// Specify relationship
		await createDialog.getByLabel("Relationship").click();
		await page.getByRole("option", { name: stringField, exact: true }).click();

		await page.getByRole("button", { name: "Create Pub" }).click();
		await page.waitForURL(`/c/${community.community.slug}/pubs/create**`);

		// Should now see a related field on the new page
		await page.getByTestId("relatedPubValue").fill("related value");

		// Fill in title and content
		const related = { title: "related", content: "I am related" };
		await page.getByTestId(`${community.community.slug}:title`).fill(related.title);
		await page.getByTestId(`${community.community.slug}:content`).fill(related.content);
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);

		// The original pub should now have a related pub which is the newly created pub
		await pubPage.goTo();
		await expect(page.getByText("related value:related")).toHaveCount(1);
		await expect(
			page.getByTestId("related-pubs").getByRole("button", { name: stringField })
		).toHaveCount(1);
		await expect(
			page
				.getByTestId("related-pubs")
				.getByRole("table")
				.getByRole("link", { name: related.title })
		).toHaveCount(1);
	});

	test("Can create a pub at a stage", async () => {
		const stage = "Shelved";
		const stagesPage = new StagesManagePage(page, community.community.slug);
		await stagesPage.goTo();
		await stagesPage.openStagePanelTab(stage, "Pubs");
		await page.getByRole("button", { name: "Create" }).click();
		await choosePubType({ page, communitySlug: community.community.slug });

		// Stage should be prefilled
		await expect(page.getByLabel("Stage")).toHaveText(stage);
		await page.getByTestId(`${community.community.slug}:title`).fill("Stage test");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByRole("status").filter({ hasText: "New pub created" })).toHaveCount(
			1
		);
		await page.getByRole("link", { name: "View Pub" }).click();
		await expect(page.getByTestId("current-stage")).toHaveText(stage);
	});
});

test.describe("Updating a pub", () => {
	test("Can update a pub from pubs list page", async () => {
		const pubsPage = new PubsPage(page, community.community.slug);
		await pubsPage.goTo();
		await page
			.getByTestId(`pub-card-${community.pubs[0].id}`)
			.getByRole("link", { name: "Update" })
			.click();

		await expect(page.getByTestId("save-status-text")).toHaveText(
			"Form will save when you click save"
		);

		const newTitle = `New title ${new Date().getTime()}`;
		await page.getByTestId(`${community.community.slug}:title`).fill(newTitle);
		await page.getByRole("button", { name: "Save" }).click();
		await expect(
			page.getByRole("status").filter({ hasText: "Pub successfully updated" })
		).toHaveCount(1);
		await expect(page.getByTestId("save-status-text")).toContainText("Last saved at");

		await page.getByRole("link", { name: "View Pub" }).click();
		await expect(page.getByRole("heading", { name: newTitle })).toHaveCount(1);
	});
});
