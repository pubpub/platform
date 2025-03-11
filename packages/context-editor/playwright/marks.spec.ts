import { expect, test } from "@playwright/test";

const BLANK_EDITOR_STORY = "/iframe.html?id=contexteditor--blank";

test.describe("bold", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});
	test("can use markdown shortcut", async ({ page }) => {
		await page.keyboard.type("hi **bold** ");
		await expect(page.getByRole("strong")).toHaveText("bold");
	});

	test("can use menu bar", async ({ page }) => {
		await page.keyboard.type("hi ");
		await page.getByRole("button", { name: "Bold" }).click();
		await page.keyboard.type("bold");
		await page.getByRole("button", { name: "Bold" }).click();
		await page.keyboard.type("not bold");
		await expect(page.getByRole("strong")).toHaveText("bold");
	});

	test("can use menu bar to affect selection", async ({ page }) => {
		await page.keyboard.type("hello world");
		// Highlight the text
		for (let i = 0; i < "world".length; i++) {
			await page.keyboard.press("Shift+ArrowLeft");
		}
		await page.getByRole("button", { name: "Bold" }).click();
		await expect(page.getByRole("strong")).toHaveText("world");
		await page.getByRole("button", { name: "Bold" }).click();
	});
});
