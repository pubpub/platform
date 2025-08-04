import type { Page, Response } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";

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
		contributor: {
			password: "password",
			role: MemberRole.contributor,
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
			members: {
				contributor: MemberRole.contributor,
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

test.describe("Pub contributor capabilities", () => {
	test("Can remove pub they have access to", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();

		// can see remove pub button
		await expect(page.getByRole("button", { name: "Remove" })).toBeVisible({
			timeout: 10_000,
		});

		// can remove pub
		await pubDetailsPage.removePub();

		const requests: Response[] = [];
		page.on("request", async (request) => {
			if (
				!request
					.url()
					.includes(`/c/${community.community.slug}/pubs/${community.pubs[0].id}`)
			) {
				return;
			}

			const res = await request.response();
			if (res) {
				requests.push(res);
			}
		});

		// going back to pub details page should show 404
		await pubDetailsPage.goTo();

		expect(requests).toHaveLength(1);
		expect(requests[0].status()).toBe(404);
	});
});
