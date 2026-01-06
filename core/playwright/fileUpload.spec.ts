import type { Page } from "@playwright/test"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { expect, test } from "@playwright/test"

import { CoreSchemaType, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { LoginPage } from "./fixtures/login-page"
import { PubsPage } from "./fixtures/pubs-page"

test.describe.configure({ mode: "serial" })

let page: Page

const seed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
		FileUpload: { schemaName: CoreSchemaType.FileUpload },
	},
	pubTypes: {
		"File Upload Test": {
			Title: { isTitle: true },
			Content: { isTitle: false },
			FileUpload: { isTitle: false },
		},
	},
	users: {
		admin: {
			password: "password",
			role: MemberRole.admin,
		},
	},
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

test.describe("File upload", () => {
	test("should upload files", async ({ context }) => {
		const pubsPage = new PubsPage(page, community.community.slug)
		await pubsPage.goTo()
		await page.waitForURL(`/c/${community.community.slug}/pubs*`)
		const title = "The Activity of Slugs"
		const pubId = await pubsPage.createPub({
			pubType: "File Upload Test",
			values: { title },
		})

		const pubEditUrl = `/c/${community.community.slug}/pubs/${pubId}/edit`
		await page.goto(pubEditUrl)

		await page.setInputFiles("input[type='file']", [
			new URL("fixtures/test-assets/test-diagram.png", import.meta.url).pathname,
			new URL("fixtures/test-assets/sample-pdf.pdf", import.meta.url).pathname,
			new URL("fixtures/test-assets/shadowman.mov", import.meta.url).pathname,
		])

		await page.getByRole("button", { name: "Upload 3 files", exact: true }).click({
			timeout: 2_000,
		})

		await page.getByText("Complete", { exact: true }).waitFor({
			timeout: 10_000,
		})

		await page.getByRole("button", { name: "Save" }).click()
		await page.getByText("Updated Pub", { exact: true }).waitFor({
			timeout: 2_000,
		})

		await page.getByRole("link", { name: title, exact: true }).click()
		await page.waitForURL(`/c/${community.community.slug}/pubs/${pubId}*`)

		// there should be 3 files
		await page
			.getByRole("region", { name: "Uploaded files (3 files)" })
			.waitFor({ timeout: 2_000 })

		await expect(page.getByText("test-diagram.png")).toBeVisible({
			timeout: 2_000,
		})

		await expect(page.getByText("image/png")).toBeVisible({
			timeout: 2_000,
		})
		await expect(page.getByText("106.3 KB")).toBeVisible({
			timeout: 2_000,
		})

		const link = page.getByTestId("FileUpload-value").getByRole("link").first()

		const url = await link.getAttribute("href", { timeout: 1_000 })

		expect(url).toBeDefined()
		await page.goto(url!)

		await page.waitForURL(/localhost:9000/)
	})

	// FIXME: THESE TESTS AREN"T WORKING IN CI
	test.describe
		.skip("file deletion", () => {
			test("when creating a pub, deleting an uploaded file should make it not uploaded", async () => {
				const fileName = "test-diagram.png"
				const pubsPage = new PubsPage(page, community.community.slug)
				await pubsPage.goTo()
				await page.waitForURL(`/c/${community.community.slug}/pubs*`)
				const pubId = await pubsPage.createPub({
					pubType: "File Upload Test",
					values: { title: "The Activity of Slugs" },
				})

				const pubEditUrl = `/c/${community.community.slug}/pubs/${pubId}/edit`
				await page.goto(pubEditUrl)

				await page.setInputFiles("input[type='file']", [
					new URL(`fixtures/test-assets/${fileName}`, import.meta.url).pathname,
				])

				await page.getByRole("button", { name: "Upload 1 file", exact: true }).click({
					timeout: 2_000,
				})

				await page.getByText("Complete", { exact: true }).waitFor({
					timeout: 10_000,
				})

				// get the url
				const link = page.getByRole("link", { name: `Open ${fileName}` }).first()
				const url = await link.getAttribute("href", { timeout: 1_000 })
				// check legit
				const opts = await fetch(url!)
				expect(opts.status).toBe(200)
				expect(opts.headers.get("content-type")).toContain("image/png")

				await page.getByRole("button", { name: `Delete ${fileName}` }).click()

				// it's immediately deleted
				await expect(link).toBeHidden({ timeout: 2_000 })
				const opts2 = await fetch(url!)
				expect(opts2.status).toBe(404)

				await page.getByRole("button", { name: "Save" }).click()
				await page.getByText("Updated Pub", { exact: true }).waitFor({
					timeout: 2_000,
				})

				await page.getByRole("link", { name: "The Activity of Slugs", exact: true }).click()
				await page.waitForURL(`/c/${community.community.slug}/pubs/${pubId}*`)

				await expect(page.getByText(fileName)).toBeHidden({ timeout: 1_000 })
			})

			test("when editing a pub, deleting an uploaded file should make it not uploaded", async () => {
				const fileName = "test-diagram.png"
				const fileName2 = "sample-pdf.pdf"
				const fileName3 = "shadowman.mov"
				const pubsPage = new PubsPage(page, community.community.slug)
				await pubsPage.goTo()
				await page.waitForURL(`/c/${community.community.slug}/pubs*`)
				const pubId = await pubsPage.createPub({
					pubType: "File Upload Test",
					values: { title: "The Activity of Slugs" },
				})

				const pubEditUrl = `/c/${community.community.slug}/pubs/${pubId}/edit`
				await page.goto(pubEditUrl)

				await page.setInputFiles("input[type='file']", [
					new URL(`fixtures/test-assets/${fileName}`, import.meta.url).pathname,
					new URL(`fixtures/test-assets/${fileName2}`, import.meta.url).pathname,
					new URL(`fixtures/test-assets/${fileName3}`, import.meta.url).pathname,
				])

				await page.getByRole("button", { name: "Upload 3 files", exact: true }).click({
					timeout: 2_000,
				})

				await page.getByText("Complete", { exact: true }).waitFor({
					timeout: 10_000,
				})

				await page.getByRole("button", { name: "Save" }).click()
				await page.getByText("Updated Pub", { exact: true }).waitFor({
					timeout: 2_000,
				})

				await page.reload()

				const link = page.getByRole("link", { name: `Open ${fileName}` }).first()
				// takes a second for the element to load in
				await link.waitFor({ timeout: 1_000 })
				const url = await link.getAttribute("href", { timeout: 1_000 })
				const opts = await fetch(url!)
				expect(opts.status).toBe(200)
				expect(opts.headers.get("content-type")).toContain("image/png")

				await page.getByRole("button", { name: `Delete ${fileName}` }).click()

				// expect it to be deleted
				await expect(link).toBeHidden({ timeout: 1_000 })
				const opts2 = await fetch(url!)
				expect(opts2.status).toBe(404)

				// don't save the pub, reload the page

				await page.reload()

				// should still be deleted
				await expect(page.getByText(fileName)).toBeHidden({ timeout: 1_000 })
				// check that the other files are still there
				await expect(page.getByText(fileName2)).toBeVisible({ timeout: 1_000 })
				await expect(page.getByText(fileName3)).toBeVisible({ timeout: 1_000 })
			})
		})
})
