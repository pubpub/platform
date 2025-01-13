import type { Page } from "@playwright/test"

import { expect, test } from "@playwright/test"

import type { PubsId } from "db/public"
import { CoreSchemaType } from "db/public"

import { FieldsPage } from "./fixtures/fields-page"
import { FormsEditPage } from "./fixtures/forms-edit-page"
import { LoginPage } from "./fixtures/login-page"
import { PubDetailsPage } from "./fixtures/pub-details-page"
import { PubTypesPage } from "./fixtures/pub-types-page"
import { choosePubType, PubsPage } from "./fixtures/pubs-page"
import { StagesManagePage } from "./fixtures/stages-manage-page"
import { createCommunity } from "./helpers"

const now = new Date().getTime()
const COMMUNITY_SLUG = `playwright-test-community-${now}`

test.describe.configure({ mode: "serial" })

let page: Page
let pubId: PubsId

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation()

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	})

	const stagesManagePage = new StagesManagePage(page, COMMUNITY_SLUG)
	await stagesManagePage.goTo()
	await stagesManagePage.addStage("Shelved")
	await stagesManagePage.addStage("Submitted")
	await stagesManagePage.addStage("Ask Author for Consent")
	await stagesManagePage.addStage("To Evaluate")

	await stagesManagePage.addMoveConstraint("Submitted", "Ask Author for Consent")
	await stagesManagePage.addMoveConstraint("Ask Author for Consent", "To Evaluate")

	const pubsPage = new PubsPage(page, COMMUNITY_SLUG)
	await pubsPage.goTo()
	pubId = await pubsPage.createPub({
		stage: "Submitted",
		values: { title: "The Activity of Snails", content: "Mostly crawling" },
	})
})

test.afterAll(async () => {
	await page.close()
})

test.describe("Pub types", () => {
	test("Can create a pub type", async () => {
		const pubTypesPage = new PubTypesPage(page, COMMUNITY_SLUG)
		await pubTypesPage.goto()
		await pubTypesPage.addType("Editor", "editor", ["title", "content"])
	})

	test("Can add relation field to pub type", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG)
		await fieldsPage.goto()
		await fieldsPage.addField("Contributor", CoreSchemaType.String, true)

		const pubTypesPage = new PubTypesPage(page, COMMUNITY_SLUG)
		await pubTypesPage.goto()
		const typeName = "Article"
		await pubTypesPage.addType(typeName, "article", ["title", "contributor"])

		await page.getByTestId(`edit-pubtype-${typeName}`).click()

		await page.getByText(`${COMMUNITY_SLUG}:contributor`, { exact: true }).waitFor()
	})

	test("Can designate a field as the title", async () => {
		const fieldsPage = new FieldsPage(page, COMMUNITY_SLUG)
		await fieldsPage.goto()
		await fieldsPage.addField("description", CoreSchemaType.String)

		const typename = "Not Article"
		const pubTypesPage = new PubTypesPage(page, COMMUNITY_SLUG)
		await pubTypesPage.goto()
		await pubTypesPage.addType(typename, "article", ["title", "description"], "description")

		await page.getByTestId(`edit-pubtype-${typename}`).click()
		const checkboxLocator = page.getByTestId(
			`${typename}:${COMMUNITY_SLUG}:description-titleField`
		)

		await expect(checkboxLocator).toBeChecked()
	})
})
