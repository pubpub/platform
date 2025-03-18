import type { Page } from "@playwright/test";

import test from "@playwright/test";

import { Action, CoreSchemaType, Event, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity } from "./helpers";

test.describe.configure({ mode: "serial" });

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
				"Log 1": {
					action: Action.log,
					config: {},
				},
				"Log 2": {
					action: Action.log,
					config: {},
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

test.describe("sequential rules", () => {
	test("can run sequential rule", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug);
		await stagesManagePage.goTo();

		await stagesManagePage.addRule("Test", {
			event: Event.actionSucceeded,
			actionInstanceName: "Log 1",
			sourceActionInstanceName: "Log 2",
		});
		await page.waitForTimeout(1_000);

		await page.getByRole("tab", { name: "Pubs", exact: true }).click();
		await page.getByRole("button", { name: "Run Action" }).first().click();

		await page.getByRole("button", { name: "Log 2" }).first().click();

		await page.getByRole("button", { name: "Run" }).first().click();

		await page.waitForTimeout(1000);

		await page.goto(`/c/${community.community.slug}/activity/actions`);

		await page.getByText("Log 1").waitFor();
		await page.getByText("Rule (Log 2 Succeeded)", { exact: true });
		await page.getByText("Log 2", { exact: true }).waitFor();

		const success = await page.getByText("success").all();
		test.expect(success).toHaveLength(2);
	});
});
