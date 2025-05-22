import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import test, { expect } from "@playwright/test";

import { Action, CoreSchemaType, Event, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";

test.describe.configure({ mode: "serial" });

let page: Page;
const adminEmail = faker.internet.email();

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
				Email: {
					action: Action.email,
					config: { subject: "Hello", body: "Content" },
				},
			},
		},
	},
	users: {
		admin: {
			email: adminEmail,
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

test.describe("email action", () => {
	const goToConfigureEmail = async (page: Page) => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug);
		await stagesManagePage.goTo();
		await stagesManagePage.openStagePanelTab("Test", "Actions");
		await page
			.getByTestId("action-instance-Email")
			.getByRole("button", { name: "Edit action" })
			.click();
	};
	const setMember = async (page: Page, email: string) => {
		await goToConfigureEmail(page);
		await page.getByTestId("autocomplete-recipientMember").fill(email);
		await page.getByRole("option", { name: email }).click();
		await page.getByRole("button", { name: "Update config" }).click();
	};

	test("can set and unset a recipient member by erasing the field via keyboard", async () => {
		await test.step("set a member", async () => {
			await setMember(page, adminEmail);
		});

		await test.step("verify that the field saved", async () => {
			// Reload the page
			await goToConfigureEmail(page);
			await expect(page.getByTestId("autocomplete-recipientMember")).toHaveValue(adminEmail);
		});

		await test.step("unset by clearing field", async () => {
			await page.getByTestId("autocomplete-recipientMember").clear();
			await page.getByRole("button", { name: "Update config" }).click();
		});

		await test.step("verify that the field cleared", async () => {
			// Reload the page
			await goToConfigureEmail(page);
			await expect(page.getByTestId("autocomplete-recipientMember")).toHaveValue("");
		});
	});

	test("can set and unset a recipient member by clearing the field via button", async () => {
		await test.step("set a member", async () => {
			await setMember(page, adminEmail);
		});

		await test.step("unset by clearing field", async () => {
			await page.getByRole("button", { name: "Clear" }).click();
			await page.getByRole("button", { name: "Update config" }).click();
		});

		await test.step("verify that the field cleared", async () => {
			// Reload the page
			await goToConfigureEmail(page);
			await expect(page.getByTestId("autocomplete-recipientMember")).toHaveValue("");
		});
	});
});
