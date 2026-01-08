import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { Action, AutomationEvent, CoreSchemaType } from "db/public"

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
		slug: "coar-test",
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
								url: "http://localhost:9999/inbox", // Placeholder
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
	await expect(page.getByText(`Received COAR Offer: ${payload.id}`)).toBeVisible()
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

	// Update the URL in the HTTP action to use the dynamic mock repo URL
	const urlInput = page.getByLabel("URL")
	await urlInput.fill(`${mockPreprintRepo.url}/inbox`)

	// Also update the target ID in the body if it's visible or just leave it for now
	// For simplicity, we just care that the URL is correct and it reaches the mock repo.

	await page.getByRole("button", { name: "Save automation" }).click()
	await page.waitForTimeout(1000)

	// Trigger the announcement by moving a pub to the Review stage
	await stagesManagePage.goTo()
	await stagesManagePage.openStagePanelTab("Inbox", "Pubs")

	// Move the "Pre-existing Pub" to Review
	await page.getByRole("button", { name: "Inbox" }).first().click()
	await page.getByText("Move to Review").first().click()

	// Verify the mock repo received the announcement
	// We use poll to wait for the async automation to complete and hit our mock server
	await expect
		.poll(() => mockPreprintRepo.getReceivedNotifications().length, { timeout: 10000 })
		.toBeGreaterThan(0)

	const notifications = mockPreprintRepo.getReceivedNotifications()
	const announcement = notifications.find((n) =>
		Array.isArray(n.type) ? n.type.includes("Announce") : n.type === "Announce"
	)
	expect(announcement).toBeDefined()
	// Verification that the payload contains what we expected
	expect(announcement?.target.id).toContain("http://localhost:")
})
