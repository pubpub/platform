import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubsPage } from "./fixtures/pubs-page";

test.describe.configure({ mode: "serial" });

const relatedPubId = crypto.randomUUID();

let page: Page;
const seed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
		Author: { schemaName: CoreSchemaType.Null, relation: true },
		Name: { schemaName: CoreSchemaType.String },
		Citation: { schemaName: CoreSchemaType.Null, relation: true },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
		Author: {
			Name: { isTitle: true },
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
	},
	pubs: [
		{
			pubType: "Submission",
			stage: "Shelved",
			values: { Title: "The Activity of Snails", Content: "Mostly crawling" },
			relatedPubs: {
				Author: [
					{
						value: null,
						pub: {
							pubType: "Author",
							values: {
								Name: "Jane Author",
							},
						},
					},
					{
						value: null,
						pub: {
							pubType: "Author",
							values: {
								Name: "Peach Cat",
							},
						},
					},
					{
						value: null,
						pub: {
							id: relatedPubId,
							pubType: "Author",
							values: {
								Name: "Woody Dog",
							},
						},
					},
				],
				Citation: [
					{
						value: null,
						pub: {
							pubType: "Submission",
							values: {
								Title: "Why dogs wag their tails",
							},
						},
					},
				],
			},
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

test("Can see a pub's relations on a pub card", async () => {
	const pubsPage = new PubsPage(page, community.community.slug);
	pubsPage.goTo();
	await page
		.getByTestId(`pub-card-${community.pubs[0].id}`)
		.getByRole("button", { name: "Relations" })
		.click();
	await expect(page.getByRole("menuitem")).toHaveCount(4);
	await page.getByRole("link", { name: "Woody Dog" }).click();
	await page.waitForURL(`/c/${community.community.slug}/pubs/${relatedPubId}`);
});
