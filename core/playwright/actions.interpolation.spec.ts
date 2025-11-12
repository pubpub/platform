import type { Page } from "@playwright/test";

import test from "@playwright/test";

import { Action, CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";

let page: Page;

const seed = createSeed({
	community: {
		name: "Test Community",
		slug: "test-community-1",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
		},
	},
	stages: {
		Test: {
			actions: {
				Log: {
					action: Action.log,
					config: {
						text: "Hello, {{ $uppercase($.pub.values.title) }}. Im running {{ $.action.name }} with Debounce: {{ $.action.config.debounce }}",
						debounce: 10,
					},
				},

				Email: {
					action: Action.email,
					config: { subject: "Hello", body: "Content" },
				},
			},
		},
	},
	users: {
		admin: {
			password: "password",
			isSuperAdmin: true,
			role: MemberRole.admin,
		},
	},
	pubs: [
		{
			pubType: "Submission",
			stage: "Test",
			values: { Title: "Test" },
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

test.describe("actions interpolation", () => {
	test("can interpolate the pub title", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction("Log", async (runActionDialog) => {
			await runActionDialog.getByRole("button", { name: "Run action" }).click();
		});
		await page
			.getByRole("status")
			.filter({
				hasText:
					"Logged out Hello, TEST. Im running Log with Debounce: 10, check your console",
			})
			.waitFor({ timeout: 5000 });
	});

	test("can interpolate the pub title with a jsonata expression", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction("Log", async (runActionDialog) => {
			await runActionDialog.getByTestId("toggle-jsonata-text").click();
			// wait for thing to load
			await page.waitForTimeout(1000);
			await runActionDialog
				.getByLabel("Log Text")
				.fill("'my title is ' & $.pub.values.title");
			await runActionDialog.getByRole("button", { name: "Run action" }).click();
		});
		await page
			.getByRole("status")
			.filter({
				hasText: "Logged out my title is Test, check your console",
			})
			.waitFor({ timeout: 5000 });
	});

	test("can test the jsonata expression", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction("Log", async (runActionDialog) => {
			await runActionDialog.getByTestId("toggle-jsonata-text").click();

			await runActionDialog.getByTestId("toggle-jsonata-test-button-text").click();

			await runActionDialog.getByLabel("Log Text").fill("$.pub.values");

			await page.waitForTimeout(500);

			await runActionDialog
				.getByLabel("Error: JSONata test interpolated value")
				.getByText(
					JSON.stringify(
						{
							[`${community.community.slug}:title`]: "Test",
							title: "Test",
						},
						null,
						2
					)
				)
				.waitFor({ timeout: 5000 });

			await page.waitForTimeout(500);

			await runActionDialog
				.getByLabel("Log Text")
				.fill("'my title is ' & $.pub.values.title");

			await page.waitForTimeout(500);

			await runActionDialog
				.getByLabel("Success: JSONata test interpolated value")
				.getByText("my title is Test")
				.waitFor({ timeout: 5000 });

			await runActionDialog.getByRole("button", { name: "Run action" }).click();

			await page
				.getByRole("status")
				.filter({
					hasText: "Logged out my title is Test, check your console",
				})
				.waitFor({ timeout: 5000 });
		});
	});
});
