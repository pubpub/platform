import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { Action, AutomationEvent, CoreSchemaType, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { createOfferReviewPayload } from "./fixtures/coar-notify-payloads"
import { LoginPage } from "./fixtures/login-page"
import { StagesManagePage } from "./fixtures/stages-manage-page"
import { expect, test } from "./test-fixtures"

const WEBHOOK_PATH = "coar-inbox"

const seed = createSeed({
	community: {
		name: "COAR Test Community",
		slug: `coar-test-${crypto.randomUUID().slice(0, 8)}`,
	},
	users: {
		admin: {
			firstName: "Admin",
			lastName: "User",
			email: `admin-${crypto.randomUUID().slice(0, 8)}@example.com`,
			password: "password",
			role: MemberRole.admin,
		},
	},
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
	stages: {
		Inbox: {
			automations: {
				"Process COAR Offer": {
					triggers: [
						{
							event: AutomationEvent.webhook,
							config: { path: WEBHOOK_PATH },
						},
					],
					actions: [
						{
							action: Action.log,
							config: { text: "Received COAR Offer: {{ $.json.id }}" },
						},
					],
				},
			},
		},
		Review: {
			automations: {
				"Announce Review": {
					triggers: [
						{
							event: AutomationEvent.pubEnteredStage,
							config: {},
						},
					],
					actions: [
						{
							action: Action.http,
							config: {
								url: "http://localhost:9999/inbox",
								method: "POST",
								body: {
									"@context": [
										"https://www.w3.org/ns/activitystreams",
										"https://coar-notify.net",
									],
									type: ["Announce", "coar-notify:ReviewAction"],
									id: "urn:uuid:{{ $.pub.id }}",
									object: {
										id: "{{ $.community.url }}/pub/{{ $.pub.id }}",
										type: ["Page", "sorg:Review"],
										"as:inReplyTo": "https://example.org/preprint/123",
									},
									target: {
										id: "http://localhost:9999",
										inbox: "http://localhost:9999/inbox/",
										type: "Service",
									},
								},
							},
						},
					],
				},
			},
		},
	},
	pubs: [
		{
			pubType: "Submission",
			stage: "Inbox",
			values: { Title: "Pre-existing Pub" },
		},
	],
	stageConnections: {
		Inbox: {
			to: ["Review"],
		},
	},
})

let community: CommunitySeedOutput<typeof seed>

test.beforeAll(async () => {
	community = await seedCommunity(seed)
})

test("COAR Notify: Incoming Offer Review", async ({ page, mockPreprintRepo }) => {
	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")

	const webhookUrl = `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/api/v0/c/${community.community.slug}/site/webhook/${WEBHOOK_PATH}`

	const payload = createOfferReviewPayload({
		preprintId: "12345",
		repositoryUrl: mockPreprintRepo.url,
		serviceUrl: `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/c/${community.community.slug}`,
	})

	// Trigger the webhook from the mock repo
	await mockPreprintRepo.sendNotification(webhookUrl, payload)

	// Check activity log to see if automation ran
	await page.goto(`/c/${community.community.slug}/activity/automations`)
	const card = page.getByTestId(/automation-run-card-.*-Process COAR Offer/)
	await expect(card).toBeVisible({ timeout: 10000 })

	// Open details to see the log message
	await card.getByText("Show details").click()
	await card.getByText("Log").click()
	await expect(card.getByText(`Received COAR Offer: ${payload.id}`)).toBeVisible()
})

test("COAR Notify: Outgoing Announce Review", async ({ page, mockPreprintRepo }) => {
	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")

	const stagesManagePage = new StagesManagePage(page, community.community.slug)
	await stagesManagePage.goTo()

	// Open the "Announce Review" automation to update the URL
	await stagesManagePage.openStagePanelTab("Review", "Automations")
	await page.getByText("Announce Review").click()

	// Expand the HTTP action config
	await page.getByTestId("action-config-card-http-collapse-trigger").click()

	// Update the URL in the HTTP action to use the dynamic mock repo URL
	const urlInput = page.getByLabel("Request URL")
	await urlInput.click()
	await page.keyboard.press("Meta+a")
	await page.keyboard.press("Backspace")
	await page.keyboard.type(`${mockPreprintRepo.url}/inbox`)

	const saveButton = page.getByRole("button", { name: "Save automation", exact: true })
	await expect(saveButton).toBeEnabled()
	await saveButton.click()

	// Wait for the form to close (Success calls onSuccess which sets automationId to null)
	await expect(saveButton).toHaveCount(0, { timeout: 10000 })

	// Trigger the announcement by moving a pub to the Review stage
	await stagesManagePage.goTo()
	await stagesManagePage.openStagePanelTab("Inbox", "Pubs")

	// Move the "Pre-existing Pub" to Review
	await page.getByRole("button", { name: "Inbox" }).first().click()
	await page.getByText("Move to Review").first().click()

	// Wait for the move to disappear from Inbox list
	await expect(page.getByText("Pre-existing Pub")).toHaveCount(0, { timeout: 15000 })

	// Verify the mock repo received the announcement
	await expect
		.poll(() => mockPreprintRepo.getReceivedNotifications().length, { timeout: 15000 })
		.toBeGreaterThan(0)

	const notifications = mockPreprintRepo.getReceivedNotifications()
	const announcement = notifications.find((n) =>
		Array.isArray(n.type) ? n.type.includes("Announce") : n.type === "Announce"
	)
	expect(announcement).toBeDefined()
	expect(announcement?.target.id).toContain("http://localhost:")
})
