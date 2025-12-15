import type { Page } from "@playwright/test"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import test from "@playwright/test"

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
				"Log Pub Entered Stage": {
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
				"Log Pub Left Stage": {
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
								expression: "$.pub.values.somenumber > 5",
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
			actions: {
				action: Action.log,
				configureAction: async () => {
					await page.getByLabel("Log Text").fill("Log 1")
				},
			},
			sourceAutomationName: "2",
			name: "log something after log 2",
		})
		await page.waitForTimeout(1_000)

		await page.getByRole("tab", { name: "Pubs", exact: true }).click()
		await page.getByRole("button", { name: "Run automations for Test" }).first().click()

		await page.getByRole("button", { name: "2" }).first().click()

		await page.getByRole("button", { name: "Run" }).first().click()

		await page.waitForTimeout(1000)

		await page.goto(`/c/${community.community.slug}/activity/automations`)

		await page.getByText("2", { exact: true }).waitFor({ timeout: 5000 })
		await page.getByText("2success", { exact: true }).waitFor({ timeout: 5000 })
		await page
			.getByText("log something after log 2", { exact: true })
			.waitFor({ timeout: 5000 })

		const success = await page.getByText("success").all()
		test.expect(success).toHaveLength(2)
	})

	test("can run pubEnteredStage automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		// move pub from Test to Review stage

		await stagesManagePage.openStagePanelTab("Test", "Pubs")

		await page.getByRole("button", { name: "Test" }).first().click()
		await page.getByText("Move to Review").first().click()

		// await page.getByTestId("pub-row-move-stage-button").first().click();
		// await page.getByRole("button", { name: "Review" }).first().click();

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/automations`)

		await page
			.getByText("Log Pub Entered Stagesuccess", { exact: true })
			.waitFor({ timeout: 5000 })
	})

	test("can run pubLeftStage automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		// move pub from Test to Review stage

		await stagesManagePage.openStagePanelTab("Review", "Pubs")

		await page.getByRole("button", { name: "Review" }).first().click()
		await page.getByText("Move to Test").first().click()

		// await page.getByTestId("pub-row-move-stage-button").first().click();
		// await page.getByRole("button", { name: "Review" }).first().click();

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/automations`)

		await page
			.getByText("Log Pub Left Stagesuccess", { exact: true })
			.first()
			.waitFor({ timeout: 5000 })
	})

	test("can run pubInStageForDuration automation", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		await page.waitForTimeout(1_000)

		await stagesManagePage.openStagePanelTab("Review", "Pubs")

		// move a pub to Published stage
		await page.getByRole("button", { name: "Review" }).first().click()
		await page.getByText("Move to Published").first().click()

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/automations`)

		await page
			.getByText("Log In Stage For Durationsuccess", { exact: true })
			.first()
			.waitFor({ timeout: 5000 })
	})
})

test.describe("automations with conditions", () => {
	test("can run automation with condition that passes", async () => {
		const stagesManagePage = new StagesManagePage(page, community.community.slug)
		await stagesManagePage.goTo()

		await stagesManagePage.openStagePanelTab("Condition", "Pubs")

		// the idea: we move both of the pubs, but only the 10 Pub should pass the condition
		await page.getByRole("button", { name: "Condition" }).first().click()
		await page.getByText("Move to Test").first().click()

		await page.getByRole("button", { name: "Condition" }).last().click()
		await page.getByText("Move to Test").last().click()

		await page.waitForTimeout(5_000)

		await page.goto(`/c/${community.community.slug}/activity/automations`)

		// we want to see one Log Left Condition success, and only for the 10 Pub
		await page
			.getByText("Log Left Conditionsuccess", { exact: true })
			.first()
			.waitFor({ timeout: 5000 })
		await page.getByRole("button", { name: "Show details" }).first().click()
		await page.getByText("10 Pub").first().waitFor({ timeout: 5000 })
	})
})
