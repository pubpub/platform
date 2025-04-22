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

test.describe("underline", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	test("can use menu bar", async ({ page }) => {
		await page.keyboard.type("hi ");
		await page.getByRole("button", { name: "Underline" }).click();
		await page.keyboard.type("underline");
		await page.getByRole("button", { name: "Underline" }).click();
		await page.keyboard.type("not underline");
		await expect(page.locator("u")).toHaveText("underline");
	});

	test("can use menu bar to affect selection", async ({ page }) => {
		await page.keyboard.type("hello world");
		// Highlight the text
		for (let i = 0; i < "world".length; i++) {
			await page.keyboard.press("Shift+ArrowLeft");
		}
		await page.getByRole("button", { name: "Underline" }).click();
		await expect(page.locator("u")).toHaveText("world");
		await assertMenuItemActiveState({ page, name: "Underline", isActive: true });
	});
});

test.describe("link", () => {
	const url = "https://www.knowledgefutures.org";

	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	test("can use menu bar", async ({ page }) => {
		const text = "link";
		await page.keyboard.type(text);
		// Highlight the text
		for (let i = 0; i < text.length; i++) {
			await page.keyboard.press("Shift+ArrowLeft");
		}
		await page.getByRole("button", { name: "Link" }).click();
		await page.getByTestId("attribute-panel").waitFor();
		await page.getByRole("textbox", { name: "URL" }).waitFor();
	});

	test("can paste a link", async ({ page, context }) => {
		await context.grantPermissions(["clipboard-write"]);
		await page.evaluate(() =>
			navigator.clipboard.writeText("https://www.knowledgefutures.org")
		);
		await page.locator(".ProseMirror").press("Meta+v");
		await page.getByRole("link", { name: url }).waitFor();
	});

	test("can add and remove a link by typing and menu bar", async ({ page }) => {
		const editor = page.locator(".ProseMirror");
		await test.step("add link by typing one", async () => {
			await editor.pressSequentially(url);
			await editor.press("Space");
			await page.getByRole("link", { name: url }).waitFor();
		});

		await test.step("remove the link", async () => {
			await editor.press("ArrowLeft");
			await editor.press("ArrowLeft");
			await assertMenuItemActiveState({ page, name: "Link", isActive: true });
			await page.getByRole("button", { name: "Link" }).click();
			await expect(page.getByRole("link", { name: url })).toHaveCount(0);
			await expect(page.getByText(url)).toHaveCount(1);
		});
	});

	test("can remove a link by using the attribute panel", async ({ page }) => {
		const editor = page.locator(".ProseMirror");
		await test.step("add link by typing one", async () => {
			await editor.pressSequentially(url);
			await editor.press("Space");
			await page.getByRole("link", { name: url }).waitFor();
		});

		await test.step("remove the link", async () => {
			await editor.press("ArrowLeft");
			await editor.press("ArrowLeft");
			await page.getByTestId("remove-link").click();
			await expect(page.getByRole("link", { name: url })).toHaveCount(0);
			await expect(page.getByText(url)).toHaveCount(1);
			await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
		});
	});
});
