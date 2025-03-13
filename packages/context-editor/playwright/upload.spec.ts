import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";

test.describe("image upload", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	test("can upload an image", async ({ page }) => {
		await page.getByRole("button", { name: "Image" }).click();
		await page.getByRole("button", { name: "browse files" }).click();
		await page
			.locator(".uppy-Dashboard-input")
			.first()
			.setInputFiles("./src/stories/assets/image0.jpg");
		await page.getByLabel("Upload 1 file").click();
		await expect(page.getByRole("img", { name: "image0.jpg" })).toHaveCount(1);
	});
});
