import type { Page } from "@playwright/test"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import test, { expect } from "@playwright/test"

import {
	Action,
	AutomationConditionBlockType,
	AutomationEvent,
	CoreSchemaType,
	MemberRole,
} from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { LoginPage } from "./fixtures/login-page"
import { StagesManagePage } from "./fixtures/stages-manage-page"

test.describe.configure({ mode: "serial" })

let page: Page

const seed = createSeed({
	community: {
		name: "Test Community",
		slug: "test-community-1",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		SomeNumber: { schemaName: CoreSchemaType.Number },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			SomeNumber: { isTitle: false },
		},
	},
	stages: {
		Test: {
			automations: {
				"1": {
					triggers: [
						{
							event: AutomationEvent.manual,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {},
						},
					],
				},
				"2": {
					triggers: [
						{
							event: AutomationEvent.manual,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {},
						},
					],
				},
			},
		},
		Review: {
			automations: {
				"1": {
					triggers: [
						{
							event: AutomationEvent.pubEnteredStage,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {
								text: "Log Entered Stage",
							},
						},
					],
				},
				"2": {
					triggers: [
						{
							event: AutomationEvent.pubLeftStage,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {
								text: "Log Left Stage",
							},
						},
					],
				},
			},
		},
		Published: {
			automations: {
				"Log In Stage For Duration": {
					triggers: [
						{
							event: AutomationEvent.pubInStageForDuration,
							config: {
								duration: 2,
								interval: "second",
							},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {
								text: "Log In Stage For Duration",
							},
						},
					],
				},
				"Log Publish": {
					triggers: [
						{
							event: AutomationEvent.manual,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {
								text: "Log Publish",
							},
						},
					],
				},
			},
		},
		Condition: {
			automations: {
				"Log Left Condition": {
					triggers: [
						{
							event: AutomationEvent.pubLeftStage,
							config: {},
						},
					],
					actions: [
						{
							action: Action.log,
							config: {
								text: "Log Left Condition",
							},
						},
					],
					condition: {
						type: AutomationConditionBlockType.AND,
						items: [
							{
								kind: "condition",
								type: "jsonata",
								expression: "$.pub.values.SomeNumber > 5",
							},
						],
					},
				},
			},
		},
	},
	stageConnections: {
		Test: {
			to: ["Review"],
		},
		Review: {
			to: ["Published"],
		},
		Condition: {
			to: ["Test"],
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
		{
			pubType: "Submission",
			stage: "Test",
			values: { Title: "Special Pub" },
		},
		{
			pubType: "Submission",
			stage: "Review",
			values: { Title: "Review Pub" },
		},
		// Condition stage pubs
		{
			pubType: "Submission",
			stage: "Condition",
			values: { Title: "10 Pub", SomeNumber: 10 },
		},
		{
			pubType: "Submission",
			stage: "Condition",
			values: { Title: "5 Pub", SomeNumber: 5 },
		},
	],
})
let community: CommunitySeedOutput<typeof seed>

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed)

	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")
})

test.afterAll(async () => {
	await page.close()
})

test.describe("sequential automations", () => {
	test("can run actionSucceeded automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		await stagesManagePage.addAutomation("Test", {
			event: AutomationEvent.automationSucceeded,
			actionInstanceName: "Log 1",
			sourceActionInstanceName: "Log 2",
		})
		await page.waitForTimeout(1_000)

		await page.getByRole("tab", { name: "Pubs", exact: true }).click()
		await page.getByRole("button", { name: "Run Automation" }).first().click()

		await page.getByRole("button", { name: "Log 2" }).first().click()

		await page.getByRole("button", { name: "Run" }).first().click()

		await page.waitForTimeout(1000)

		await page.goto(`/c/${community.community.slug}/activity/actions`)

		await page.getByText("Log 1").waitFor({ timeout: 5000 })
		await page
			.getByText("Automation (Log 2 succeeded)", { exact: true })
			.waitFor({ timeout: 5000 })
		await page.getByText("Log 2", { exact: true }).waitFor({ timeout: 5000 })

		const success = await page.getByText("success").all()
		test.expect(success).toHaveLength(2)
	})

	test("can run pubEnteredStage automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		// move pub from Test to Review stage

		await stagesManagePage.openStagePanelTab("Test", "Pubs")

		await page.getByRole("button", { name: "Test" }).first().click()
		await page.getByRole("button", { name: "Move to Review" }).first().click()

		// await page.getByTestId("pub-row-move-stage-button").first().click();
		// await page.getByRole("button", { name: "Review" }).first().click();

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/actions`)

		const row = page
			.getByTestId(/data-table-row-action-run-Review-pubEnteredStage-log.*/i)
			.first()

		await row.waitFor({ timeout: 5000 })
		await row.getByText("success").waitFor({ timeout: 5000 })
	})

	test("can run pubLeftStage automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		// move pub from Test to Review stage

		await stagesManagePage.openStagePanelTab("Review", "Pubs")

		await page.getByRole("button", { name: "Review" }).first().click()
		await page.getByRole("button", { name: "Move to Test" }).first().click()

		// await page.getByTestId("pub-row-move-stage-button").first().click();
		// await page.getByRole("button", { name: "Review" }).first().click();

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/actions`)

		const row = page.getByTestId(/data-table-row-action-run-Test-pubLeftStage-log.*/i).first()

		await row.waitFor({ timeout: 5000 })
		await row.getByText("success").waitFor({ timeout: 5000 })
	})

	test("can run pubInStageForDuration automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		await page.waitForTimeout(1_000)

		await stagesManagePage.openStagePanelTab("Review", "Pubs")

		// move a pub to Published stage
		await page.getByRole("button", { name: "Review" }).first().click()
		await page.getByRole("button", { name: "Move to Published" }).first().click()

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/actions`)

		const row = page
			.getByTestId(/data-table-row-action-run-published-pubInStageForDuration-log.*/i)
			.first()

		await row.waitFor({ timeout: 5000 })
		await row.getByText("success").waitFor({ timeout: 5000 })
		await page
			.getByText("Automation (Pub in stage for duration)", { exact: false })
			.waitFor({ timeout: 5000 })

		const success = await page.getByText("success").all()
		test.expect(success.length).toBeGreaterThanOrEqual(1)
	})
})

test.describe("automations with conditions", () => {
	test("can run automation with condition that passes", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		await stagesManagePage.openStagePanelTab("Condition", "Pubs")

		await page.getByRole("button", { name: "Condition" }).first().click()
		await page.getByRole("button", { name: "Move to Test" }).first().click()

		await page.getByRole("button", { name: "Condition" }).last().click()
		await page.getByRole("button", { name: "Move to Test" }).last().click()

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/actions`)
		const row = page
			.getByTestId(/data-table-row-action-run-condition-pubLeftStage-log.*/i)
			.first()
		await row.waitFor({ timeout: 5000 })
		await row.getByText("success").waitFor({ timeout: 5000 })
		await Promise.all([
			expect(row.getByText("10 Pub")).toBeVisible(),
			expect(row.getByText("5 Pub")).not.toBeVisible(),
		])
	})

	// test("automation with condition that fails should not run", async () => {
	// 	// add another automation with a failing condition
	// 	await page.evaluate(
	// 		async ({ stageId, automationId }) => {
	// 			const response = await fetch(
	// 				`${window.location.origin}/api/v0/c/test-community-1/stages/${stageId}/automations`,
	// 				{
	// 					method: "POST",
	// 					headers: {
	// 						"Content-Type": "application/json",
	// 					},
	// 					body: JSON.stringify({
	// 						event: "pubEnteredStage",
	// 						automationId,
	// 						name: "Log Publish",
	// 						triggers: [
	// 							{
	// 								event: AutomationEvent.pubEnteredStage,
	// 								config: {},
	// 							},
	// 						],
	// 						actions: [
	// 							{
	// 								action: Action.log,
	// 								config: {
	// 									text: "Log Publish",
	// 								},
	// 							},
	// 						],
	// 						condition: {
	// 							type: "AND",
	// 							items: [
	// 								{
	// 									kind: "condition",
	// 									type: "jsonata",
	// 									expression: '$.pub.values.Title = "Nonexistent Pub"',
	// 								},
	// 							],
	// 						},
	// 					}),
	// 				}
	// 			);
	// 			if (!response.ok) {
	// 				throw new Error(`Failed to create automation: ${await response.text()}`);
	// 			}
	// 		},
	// 		{
	// 			stageId: community.stages.Published.id,
	// 			automationId: community.stages.Published.automations["Log Publish"].id,
	// 		}
	// 	);

	// 	await page.waitForTimeout(1_000);

	// 	const stagesManagePage = new StagesManagePage(page, community.community.slug);
	// 	await stagesManagePage.goTo();
	// 	await page.getByRole("tab", { name: "Pubs", exact: true }).click();

	// 	// get initial action count
	// 	await page.goto(`/c/${community.community.slug}/activity/actions`);
	// 	const initialActions = await page.locator("tr").count();

	// 	// move "Test" pub to Published stage
	// 	await page.goto(`/c/${community.community.slug}/stages/manage`);
	// 	await page.getByRole("tab", { name: "Pubs", exact: true }).click();

	// 	const testPubRow = page.locator('tr:has-text("Test")');
	// 	await testPubRow.getByTestId("pub-row-move-stage-button").click();
	// 	await page.getByRole("button", { name: "Published" }).first().click();

	// 	await page.waitForTimeout(1000);

	// 	await page.goto(`/c/${community.community.slug}/activity/actions`);
	// 	const finalActions = await page.locator("tr").count();

	// 	// the automation should not have run, so action count should be the same
	// 	test.expect(finalActions).toBe(initialActions);
	// });
})
