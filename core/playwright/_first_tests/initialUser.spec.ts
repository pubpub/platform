// warn: this test will wipe your db

import type { Page } from "@playwright/test"

import { faker } from "@faker-js/faker"
import test from "@playwright/test"
import { sql } from "kysely"

import { db } from "~/kysely/database"
import { LoginPage } from "../fixtures/login-page"

test.describe.configure({ mode: "serial" })

let page: Page
const adminEmail = faker.internet.email()
const uuid = crypto.randomUUID()
const communitySlug = `test-community-${uuid}`

test.beforeAll(async ({ browser }) => {
	// truncate db
	await sql`TRUNCATE TABLE users CASCADE`.execute(db)
	await sql`TRUNCATE TABLE communities CASCADE`.execute(db)

	page = await browser.newPage()
	const loginPage = new LoginPage(page)
	await loginPage.goto()
})

test.afterAll(async () => {
	await page.close()
})

test.describe("initial user", () => {
	test("should be able to create a user", async () => {
		await page.getByLabel("First name").fill("John")
		await page.getByLabel("Last name").fill("Doe")
		await page.getByLabel("Email").fill(adminEmail)
		await page.getByRole("textbox", { name: "password" }).fill("password")

		await page.getByLabel("Community Name").fill("Test Community")
		await page.getByLabel("Community Slug").fill(communitySlug)

		await page.getByRole("button", { name: "Complete Setup" }).click()

		await page.waitForURL(`/c/${communitySlug}**`)
	})
})
