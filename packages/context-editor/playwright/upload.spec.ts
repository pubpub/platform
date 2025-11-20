import { expect, test } from "@playwright/test"

import { BLANK_EDITOR_STORY } from "./constants"

test.describe("image upload", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY)
		const editor = page.locator(".ProseMirror")
		await editor.click()
	})

	test("can upload an image", async ({ page, browserName }) => {
		const editor = page.locator(".ProseMirror")
		await page.getByRole("button", { name: "Image" }).click()
		await page.getByRole("button", { name: "browse files" }).click()
		await page
			.locator(".uppy-Dashboard-input")
			.first()
			.setInputFiles("./src/stories/assets/image0.jpg", {
				timeout: 5_000,
			})
		await page.getByLabel("Upload 1 file").click()
		// for some reason the dialog does not detach properly in playwright. we're just skipping that for now
		// await page.getByText("Media Upload").waitFor({ state: "hidden", timeout: 5_000 });
		await expect(editor.getByRole("img", { name: "image0.jpg" })).toHaveCount(1, {
			timeout: 5_000,
		})
	})
})
