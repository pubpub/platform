import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";
import { assertMenuItemActiveState } from "./utils";

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

test.describe("strikethrough", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	test("can use menu bar", async ({ page }) => {
		await page.keyboard.type("hi ");
		await page.getByRole("button", { name: "Strikethrough" }).click();
		await page.keyboard.type("im deleted");
		await page.getByRole("button", { name: "Strikethrough" }).click();
		await page.keyboard.type("not deleted");
		await expect(page.locator("s")).toHaveText("im deleted");
	});

	test("can use menu bar to affect selection", async ({ page }) => {
		await page.keyboard.type("hello world");
		// Highlight the text
		for (let i = 0; i < "world".length; i++) {
			await page.keyboard.press("Shift+ArrowLeft");
		}
		await page.getByRole("button", { name: "Strikethrough" }).click();
		await expect(page.locator("s")).toHaveText("world");
		await assertMenuItemActiveState({ page, name: "Strikethrough", isActive: true });
	});
});

test.describe("sub and superscript", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	for (const { name, tag } of [
		{ name: "Superscript", tag: "sup" },
		{ name: "Subscript", tag: "sub" },
	]) {
		test(`can use menu bar for ${name}`, async ({ page }) => {
			const text = name.toLowerCase();
			await page.keyboard.type("hi ");
			await page.getByRole("button", { name }).click();
			await page.keyboard.type(text);
			await page.getByRole("button", { name }).click();
			await page.keyboard.type(`not ${text}`);
			await expect(page.locator(tag)).toHaveText(text);
		});
	}

	for (const { name, tag } of [
		{ name: "Superscript", tag: "sup" },
		{ name: "Subscript", tag: "sub" },
	]) {
		test(`can use menu bar to affect selection for ${name}`, async ({ page }) => {
			await page.keyboard.type("hello world");
			// Highlight the text
			for (let i = 0; i < "world".length; i++) {
				await page.keyboard.press("Shift+ArrowLeft");
			}
			await page.getByRole("button", { name }).click();
			await expect(page.locator(tag)).toHaveText("world");
			await assertMenuItemActiveState({ page, name, isActive: true });
		});
	}
});
