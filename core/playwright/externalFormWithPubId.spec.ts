import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { CoreSchemaType, ElementType, InputComponent, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubFieldsOfEachType } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;

const seed = createSeed({
	community: {
		name: "Test Community",
		slug: "test-community-x",
	},
	users: {
		admin: {
			email: faker.internet.email(),
			role: MemberRole.admin,
			password: "password",
		},
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
		Content: {
			schemaName: CoreSchemaType.String,
		},
		Related: {
			schemaName: CoreSchemaType.String,
			relation: true,
		},
		Animals: {
			schemaName: CoreSchemaType.StringArray,
		},
		...PubFieldsOfEachType,
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			StringArray: { isTitle: false },
			Related: { isTitle: false },
		},
		Evaluation: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Email: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {},
	},
	pubs: [
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "Do not let anyone edit me",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "I have a title and content",
				Content: "My content",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: { Title: "Array fields", Animals: ["penguin"] },
			relatedPubs: {
				Related: [
					{
						value: "test relation value",
						pub: {
							pubType: "Submission",
							values: {
								Title: "A pub related to another Pub",
							},
						},
					},
				],
			},
		},
	],
	forms: {
		Evaluation: {
			slug: "evaluation",
			pubType: "Evaluation",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Content",
					component: InputComponent.textArea,
					config: {
						label: "Content",
					},
				},
				{
					type: ElementType.pubfield,
					field: CoreSchemaType.Email,
					component: InputComponent.textInput,
					config: {
						label: "Email",
					},
				},
			],
		},
		"Title Only": {
			slug: "title-only",
			pubType: "Submission",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
			],
		},
		"Array fields": {
			slug: "array-fields",
			pubType: "Submission",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Animals",
					component: InputComponent.multivalueInput,
					config: {},
				},
				{
					type: ElementType.pubfield,
					field: "Related",
					component: InputComponent.textInput,
					relatedPubTypes: ["Submission"],
					config: {
						relationshipConfig: {
							label: "related",
							help: "help",
							component: InputComponent.relationBlock,
						},
					},
				},
			],
		},
	},
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

test.describe("Rendering the external form", () => {
	test("Can render the form with validation", async () => {
		await page.goto(
			`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill?pubId=${community.pubs[0].id}`
		);
		await expect(page.locator("h1").filter({ hasText: "Evaluation" })).toHaveCount(1);
		await page.getByTestId(`${community.community.slug}:email`).fill("not an email");
		await expect(page.locator("p").filter({ hasText: "Invalid email address" })).toHaveCount(1);
		await page.getByTestId(`${community.community.slug}:email`).fill("test@email.com");
		await expect(page.locator("p").filter({ hasText: "Invalid email address" })).toHaveCount(0);
	});

	test("Can save a subset of a pub's values", async () => {
		await page.goto(
			`/c/${community.community.slug}/public/forms/${community.forms["Title Only"].slug}/fill?pubId=${community.pubs[2].id}`
		);

		// Update the title
		const newTitle = "New title";
		await page.getByTestId(`${community.community.slug}:title`).fill(newTitle);
		// There should not be a Content field
		await expect(page.getByTestId(`${community.community.slug}:content`)).toHaveCount(0);
		await page.getByRole("button", { name: "Submit" }).click();
		await expect(page.getByTestId("completed")).toHaveCount(1);

		// Visit the pub's page
		const pubPage = new PubDetailsPage(page, community.community.slug, community.pubs[2].id);
		await pubPage.goTo();
		await expect(page.getByTestId(`Content-value`)).toHaveText("My content");
		await expect(page.getByRole("heading", { name: newTitle })).toHaveCount(1);
	});
});

test("Removing array fields", async () => {
	const formUrl = `/c/${community.community.slug}/public/forms/${community.forms["Array fields"].slug}/fill?pubId=${community.pubs[3].id}`;
	await page.goto(formUrl);
	await page.getByRole("button", { name: "penguin" }).getByTestId("remove-button").click();
	await page.getByRole("button", { name: "Delete link to related pub" }).click();
	await page.getByRole("button", { name: "Submit" }).click();
	await expect(page.getByTestId("completed")).toHaveCount(1);

	// Visit the form again and make sure the values were removed
	await page.goto(formUrl);
	await expect(page.getByRole("button", { name: "penguin" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Delete link to related pub" })).toHaveCount(0);
});
