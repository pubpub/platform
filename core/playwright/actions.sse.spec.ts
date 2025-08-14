import type { Browser } from "@playwright/test";

import test, { expect } from "@playwright/test";

import { Action, CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";

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

const loggedInPage = async (browser: Browser) => {
	const page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");

	return page;
};

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);
});

test.describe("Actions SSE", () => {
	test("should revalidate the page when an action is performed", async ({ browser }) => {
		const page1 = await loggedInPage(browser);

		const stagePage1 = new StagesManagePage(page1, community.community.slug);
		await stagePage1.goTo();

		const page2 = await loggedInPage(browser);
		const stagePage2 = new StagesManagePage(page2, community.community.slug);
		await stagePage2.goTo();
		await stagePage2.openStagePanelTab(community.stages.Test.name, "Actions");

		// check that action is there
		await expect(page2.getByText("Log 1")).toBeVisible();
		await expect(
			page2.getByTestId(
				`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle`
			)
		).not.toBeVisible();

		const extraStringRun1 = "`This is Run 1`";
		await test.step("trigger action for first time", async () => {
			await stagePage1.openStagePanelTab(community.stages.Test.name, "Pubs");
			await page1.getByRole("button", { name: "Run Action" }).first().click();
			await page1.getByRole("button", { name: "Log 1" }).first().click();

			await page1
				.getByRole("textbox", { name: "The string to log out in" })
				.fill(extraStringRun1);

			await page1.getByRole("button", { name: "Run" }).first().click();

			await page1
				.getByText("Successfully ran Log 1", { exact: true })
				.waitFor({ timeout: 5_000 });
		});

		const updateCircle = page2.getByTestId(
			`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle`
		);
		await test.step("check that other tab sees the update", async () => {
			await expect(page2.getByText("Log 1")).toBeVisible();

			await expect(updateCircle).toBeVisible();

			await expect(updateCircle).toHaveAttribute("data-status", "success");
		});

		const staleIndicator = page2.getByTestId(
			`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle-stale`
		);

		let timestamp1: string;
		let report1: string;
		await test.step("hovering over the icon makes the stale indicator dissappear and show the data", async () => {
			await expect(staleIndicator).toBeVisible();

			await updateCircle.hover();
			await page2.waitForTimeout(100);
			await expect(staleIndicator).not.toBeVisible();

			const timestamp = await page2
				.getByTestId(
					`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle-timestamp`
				)
				// needs first bc radix does some evil stuff with the popover, duplicating it?
				.first()
				.textContent({ timeout: 1_000 });
			const report = await page2
				.getByTestId(
					`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle-result`
				)
				.first()
				.textContent({ timeout: 1_000 });

			expect(timestamp).toBeDefined();
			expect(report).toBeDefined();

			timestamp1 = timestamp!;
			report1 = report!;

			// un-hover, focus mouse elsewhere
			await page2.getByRole("heading", { name: "Actions" }).first().click();
		});

		const extraStringRun2 = "`This is Run 2`";
		await test.step("running the action again should make the stale indicator reappear and update the data", async () => {
			await page1
				.getByRole("textbox", { name: "The string to log out in" })
				.fill(extraStringRun2);

			await page1.getByRole("button", { name: "Run" }).first().click();

			await page1
				.getByText("Successfully ran Log 1", { exact: true })
				.waitFor({ timeout: 5_000 });

			await expect(updateCircle).toBeVisible();
			await expect(staleIndicator).toBeVisible();

			await updateCircle.hover();

			const timestamp = await page2
				.getByTestId(
					`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle-timestamp`
				)
				.first()
				.textContent({ timeout: 1_000 });
			const report = await page2
				.getByTestId(
					`action-instance-${community.stages.Test.actions["Log 1"].id}-update-circle-result`
				)
				.first()
				.textContent({ timeout: 1_000 });

			expect(timestamp).toBeDefined();
			expect(report).toBeDefined();

			expect(timestamp).not.toMatch(timestamp1);
			expect(report).not.toMatch(report1);
		});
	});
});
