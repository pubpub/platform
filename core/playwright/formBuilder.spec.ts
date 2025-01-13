/**
 * Serial test which creates a form and form elements via the form builder
 */

import type { Page } from "@playwright/test"

import { expect, test } from "@playwright/test"

import { FormsPage } from "./fixtures/forms-page"
import { LoginPage } from "./fixtures/login-page"
import { createCommunity } from "./helpers"

test.describe.configure({ mode: "serial" })

const now = new Date().getTime()
const FORM_SLUG = `playwright-test-form-${now}`
const COMMUNITY_SLUG = `playwright-test-community-${now}`

// Single page instance https://playwright.dev/docs/test-retries#reuse-single-page-between-tests
let page: Page

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation()

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	})
})

test.afterAll(async () => {
	await page.close()
})

test.describe("Creating a form", () => {
	test("Create a new form for the first time", async () => {
		const formsPage = new FormsPage(page, COMMUNITY_SLUG)
		await formsPage.goto()
		await formsPage.addForm("new form", FORM_SLUG)
		await page.waitForURL(`/c/${COMMUNITY_SLUG}/forms/${FORM_SLUG}/edit`)
	})
	test("Cannot create a form with the same slug", async () => {
		const formsPage = new FormsPage(page, COMMUNITY_SLUG)
		await formsPage.goto()
		await formsPage.addForm("another form", FORM_SLUG)
		await expect(page.getByRole("status").filter({ hasText: "Error" })).toHaveCount(1)
	})
	test("Can archive and restore a form", async () => {
		const formsPage = new FormsPage(page, COMMUNITY_SLUG)
		await formsPage.goto()

		// Open actions menu and archive form
		await page.getByTestId(`${FORM_SLUG}-actions-button`).click()
		await page.getByTestId(`${FORM_SLUG}-archive-button`).click()

		// Now that there's an archived form, it should be under the archived tab
		await page.getByRole("tablist").getByText("Archived").click()

		// Restore that form
		await page.getByTestId(`${FORM_SLUG}-actions-button`).click()
		await page.getByTestId(`${FORM_SLUG}-restore-button`).click()

		// After restoring, there shouldn't be an archived tab anymore
		expect(await page.getByRole("tablist")).not.toBeAttached()
		expect(await page.getByTestId(`${FORM_SLUG}-actions-button`)).toBeAttached()
	})
})

test.describe("Submission buttons", () => {
	test("Add a new button and edit without saving", async () => {
		await page.goto(`/c/${COMMUNITY_SLUG}/forms/${FORM_SLUG}/edit`)
		await page.getByTestId("add-submission-settings-button").click()
		await page.getByTestId("save-button-configuration-button").click()
		await page.getByTestId("button-option-Submit").getByTestId("edit-button").click()
		const newButtonLabel = "Submit now"
		await page.getByRole("textbox", { name: "label" }).fill(newButtonLabel)
		await page.getByTestId("save-button-configuration-button").click()
		await page.getByTestId(`button-option-${newButtonLabel}`).getByTestId("edit-button").click()
	})

	test("Add two new buttons", async () => {
		await page.goto(`/c/${COMMUNITY_SLUG}/forms/${FORM_SLUG}/edit`)
		// Add first button with default fields
		await page.getByTestId("add-submission-settings-button").click()
		await page.getByTestId("save-button-configuration-button").click()
		await page.getByTestId("button-option-Submit")

		// Add second button
		await page.getByTestId("add-submission-settings-button").click()
		// Try a button with the same name first
		await page.getByRole("textbox", { name: "label" }).fill("Submit")
		await page.getByTestId("save-button-configuration-button").click()
		await expect(page.getByTestId("label-form-message")).toHaveText(
			"There is already a button with this label"
		)
		await page.getByRole("textbox", { name: "label" }).fill("Decline")
		await page.getByTestId("save-button-configuration-button").click()
		await page.getByTestId("button-option-Submit")
		await page.getByTestId("button-option-Decline")

		// Shouldn't be able to add more buttons
		await expect(page.getByTestId("add-submission-settings-button")).toHaveCount(0)

		// Save to the server
		await page.getByTestId("save-form-button").click()
		await expect(
			page.getByRole("status").filter({ hasText: "Form Successfully Saved" })
		).toHaveCount(1)
	})

	test("Editing a saved button", async () => {
		const newData = { label: "Decline politely", content: "New description" }
		page.on("request", (request) => {
			if (request.method() === "POST" && request.url().includes(`forms/${FORM_SLUG}/edit`)) {
				const data = request.postDataJSON()
				const buttons = data[0].elements.filter((e: any) => e.type === "button")
				const declineButton = buttons.find((b: any) => b.label === newData.label)
				expect(declineButton.content).toEqual(newData.content)
			}
		})

		await page.goto(`/c/${COMMUNITY_SLUG}/forms/${FORM_SLUG}/edit`)
		await page.getByTestId("button-option-Decline").getByTestId("edit-button").click()
		await page.getByRole("textbox", { name: "label" }).fill(newData.label)
		await page.getByRole("textbox").nth(1).fill(newData.content)
		await page.getByTestId("save-button-configuration-button").click()

		await page.getByTestId("save-form-button").click()
		await expect(
			page.getByRole("status").filter({ hasText: "Form Successfully Saved" })
		).toHaveCount(1)
	})
})
