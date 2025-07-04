import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";
import { assertMenuItemActiveState, getProsemirrorState } from "./utils";

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

	test("can paste a link", async ({ page, browserName }) => {
		// TODO: This test passes locally for all browsers, but not in CI on webkit
		if (browserName === "webkit" && process.env.CI) {
			return;
		}

		const editor = page.locator(".ProseMirror");

		await editor.click();

		await editor.press("Enter");
		await editor.press("ArrowUp");

		await editor.pressSequentially("https://www.knowledgefutures.org ");

		await page
			.locator(".ProseMirror a", { hasText: "https://www.knowledgefutures.org" })
			.first()
			.click({
				clickCount: 3,
			});
		await editor.press("ControlOrMeta+C");

		await editor.press("ArrowDown");
		await editor.press("ArrowDown");
		await editor.press("Enter");

		await editor.press("ControlOrMeta+v");

		const count = await editor.getByRole("link", { name: url }).count();
		expect(count).toBe(2);
	});

	test("can add a link via cmd+k", async ({ page }) => {
		const editor = page.locator(".ProseMirror");
		const text = "link";
		await editor.pressSequentially(text);
		// Highlight the text
		for (let i = 0; i < text.length; i++) {
			await page.keyboard.press("Shift+ArrowLeft");
		}
		await editor.press("ControlOrMeta+k");
		await editor.getByRole("link", { name: text }).waitFor();
		const panel = page.getByTestId("attribute-panel");
		await expect(panel.getByRole("textbox", { name: "URL" })).toBeFocused();
	});

	test("can add and remove a link by typing and menu bar", async ({ page }) => {
		const editor = page.locator(".ProseMirror");
		await test.step("add link by typing one", async () => {
			await editor.pressSequentially(url);
			await editor.press("Space");
			await editor.getByRole("link", { name: url }).waitFor();
		});

		await test.step("remove the link", async () => {
			await editor.press("ArrowLeft");
			await editor.press("ArrowLeft");
			await assertMenuItemActiveState({ page, name: "Link", isActive: true });
			await page.getByRole("button", { name: "Link" }).click();
			await expect(editor.getByRole("link", { name: url })).toHaveCount(0);
			await expect(editor.getByText(url)).toHaveCount(1);
		});
	});

	test.describe("attribute panel", () => {
		const addLinkAndOpenMenu = async (page: Page) => {
			const editor = page.locator(".ProseMirror");
			await editor.pressSequentially(url);
			await editor.press("Space");
			await editor.getByRole("link", { name: url }).waitFor();
			await editor.press("ArrowLeft");
			await editor.press("ArrowLeft");
			await page.getByTestId("attribute-panel").waitFor();
		};
		test("can remove a link by using the attribute panel", async ({ page }) => {
			await addLinkAndOpenMenu(page);
			await test.step("remove the link", async () => {
				const editor = page.locator(".ProseMirror");
				await page.getByTestId("remove-link").click();
				await expect(editor.getByRole("link", { name: url })).toHaveCount(0);
				await expect(editor.getByText(url)).toHaveCount(1);
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can fill out the panel and persist to state", async ({ page }) => {
			const id = "id";
			const className = "className";
			await addLinkAndOpenMenu(page);
			const panel = page.getByTestId("attribute-panel");
			await panel.waitFor({ state: "visible" });
			await panel.getByRole("textbox", { name: "URL" }).fill(url);
			await panel.getByRole("switch", { name: "Open in new tab" }).click();
			await panel.getByTestId("advanced-options-trigger").click();
			await panel.getByRole("textbox", { name: "id" }).fill(id);
			await panel.getByRole("textbox", { name: "class" }).fill(className);
			// Force blur
			await page.locator(".ProseMirror").click();

			await test.step("verify state", async () => {
				const state = await getProsemirrorState(page);
				const linkState = state?.content[0].content[0].marks[0];
				expect(linkState.type).toEqual("link");
				expect(linkState.attrs).toEqual({
					id,
					class: className,
					href: url,
					target: "_blank",
				});
			});
		});
	});
});
