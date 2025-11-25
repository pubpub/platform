import { expect, test } from "@playwright/test"

import { BLANK_EDITOR_STORY } from "./constants"

test.describe("suggest panel", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY)
		const editor = page.locator(".ProseMirror")
		await editor.click()
	})

	test("can open a suggestion menu, filter, and select", async ({ page }) => {
		await test.step("open suggestion menu", async () => {
			await page.keyboard.type(`@`)
			// There should be 16 possible things to insert from the fixture data
			await expect(page.getByTestId("suggest-item")).toHaveCount(16)
		})

		await test.step("filter", async () => {
			await page.keyboard.type("review")
			await expect(page.getByTestId("suggest-item")).toHaveCount(3)
			const items = ["Insert new Review", "Insert Review 1", "Insert Review 2"]
			for (const [index, item] of items.entries()) {
				await expect(page.getByTestId("suggest-item").nth(index)).toHaveText(item)
			}
		})

		await test.step("select and insert", async () => {
			await page.keyboard.press("ArrowDown")
			await page.keyboard.press("Enter")
			await page.getByRole("button", { name: "/Review" }).waitFor()
			// Check for an excerpt from Review 1
			await page
				.locator(".ProseMirror")
				.getByText("presents an intriguing and innovative")
				.waitFor()
		})
	})
})

test.describe("atom renderer", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY)
		const editor = page.locator(".ProseMirror")
		await editor.click()
	})

	test("can render an image with the atom renderer and the attribute panel", async ({ page }) => {
		await test.step("insert image", async () => {
			await page.keyboard.type(`@media`)
			await page.keyboard.press("Enter")
			await page.getByRole("button", { name: "/Media" }).waitFor()
		})

		await test.step("set image", async () => {
			const imageName = "test image"
			await page.getByTestId("attribute-panel").waitFor()
			await page.getByText("Atom Data").waitFor()
			await page.getByRole("textbox", { name: "rd:source" }).fill("/image1.jpeg")
			await page.getByRole("textbox", { name: "rd:alt" }).fill(imageName)
			await page.locator(".ProseMirror").getByRole("img", { name: imageName }).waitFor()
		})
	})
})
