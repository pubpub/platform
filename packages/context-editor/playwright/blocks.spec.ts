import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";
import { assertMenuItemActiveState } from "./utils";

test.describe("lists", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	for (const shortcut of ["* ", "- "]) {
		test(`can use markdown shortcut ${shortcut} for bullet lists`, async ({ page }) => {
			await assertMenuItemActiveState({ page, name: "Bullet list", isActive: false });
			const text = "one";
			await page.keyboard.type(`${shortcut} ${text}`);
			await expect(page.getByRole("listitem")).toContainText(text);
			await assertMenuItemActiveState({ page, name: "Bullet list", isActive: true });

			// Assert the attribute panel buttons exist
			for (const block of ["bullet_list", "list_item"]) {
				await expect(page.getByRole("button", { name: block })).toHaveCount(1);
			}

			// Backspace undoes it all
			// +2 which should remove the list structure too
			for (let i = 0; i < text.length + 2; i++) {
				await page.keyboard.press("Backspace");
			}
			for (const block of ["bullet_list", "list_item"]) {
				await expect(page.getByRole("button", { name: block })).toHaveCount(0);
			}
			await assertMenuItemActiveState({ page, name: "Bullet list", isActive: false });
		});
	}

	/** Similar to the test above, but not parameterizing because nested parameters are confusing */
	test(`can use markdown shortcut 1. for number lists`, async ({ page }) => {
		await assertMenuItemActiveState({ page, name: "Ordered list", isActive: false });
		const text = "one";
		await page.keyboard.type(`1. ${text}`);
		await expect(page.getByRole("listitem")).toContainText(text);
		await assertMenuItemActiveState({ page, name: "Ordered list", isActive: true });

		// Assert the attribute panel buttons exist
		for (const block of ["ordered_list", "list_item"]) {
			await expect(page.getByRole("button", { name: block })).toHaveCount(1);
		}
		// Backspace undoes it all
		// +2 which should remove the list structure too
		for (let i = 0; i < text.length + 2; i++) {
			await page.keyboard.press("Backspace");
		}
		for (const block of ["ordered_list", "list_item"]) {
			await expect(page.getByRole("button", { name: block })).toHaveCount(0);
		}
		await assertMenuItemActiveState({ page, name: "Ordered list", isActive: false });
	});

	for (const listType of ["Bullet list", "Ordered list"]) {
		test(`can activate and deactivate ${listType} through the menu bar`, async ({ page }) => {
			await page.getByRole("button", { name: listType }).click();
			await page.keyboard.type("one");
			await expect(page.getByRole("listitem")).toContainText("one");
			await assertMenuItemActiveState({ page, name: listType, isActive: true });
			// Assert the attribute panel buttons exist
			const blockName = listType.toLowerCase().replace(" ", "_");
			for (const block of [blockName, "list_item"]) {
				await expect(page.getByRole("button", { name: block })).toHaveCount(1);
			}
			// And can undo it
			await page.getByRole("button", { name: listType }).click();
			await expect(page.getByRole("button", { name: blockName })).toHaveCount(0);
			await assertMenuItemActiveState({ page, name: listType, isActive: false });
		});
	}

	for (const { indent, deindent } of [
		{ indent: "ControlOrMeta+]", deindent: "ControlOrMeta+[" },
		{ indent: "Tab", deindent: "Shift+Tab" },
	])
		for (const listType of ["Bullet list", "Ordered list"]) {
			test(`can add sublists for ${listType} via ${indent} and ${deindent}`, async ({
				page,
			}) => {
				const blockName = listType.toLowerCase().replace(" ", "_");
				await page.getByRole("button", { name: listType }).click();
				// This will look like:
				// 1. one
				// 2. two
				await page.keyboard.type("one");
				await page.keyboard.press("Enter");
				await page.keyboard.type("two");
				await expect(page.getByRole("listitem")).toHaveCount(2);
				await expect(page.getByRole("list")).toHaveCount(1);

				// Now we indent 2. so it looks like and there should be two lists
				// 1. one
				//   1. two
				await page.keyboard.press(indent);
				await expect(page.getByRole("list")).toHaveCount(2);

				// Can unindent
				await page.keyboard.press(deindent);
				await expect(page.getByRole("list")).toHaveCount(1);

				// Enter twice will exit the list
				await page.keyboard.press("Enter");
				await assertMenuItemActiveState({ page, name: listType, isActive: true });
				await page.keyboard.press("Enter");
				await assertMenuItemActiveState({ page, name: listType, isActive: false });
			});
		}

	/**
	 * For the requirement:
	 * Typing enter in a list and then delete creates a new paragraph within the previous list item,
	 * so that users can create block elements within a list
	 */
	for (const listType of ["Bullet list", "Ordered list"]) {
		test(`can add new paragraphs in list items for ${listType}`, async ({ page }) => {
			const blockName = listType.toLowerCase().replace(" ", "_");
			await page.getByRole("button", { name: listType }).click();
			// This will look like:
			// 1. one
			// 2. two
			await page.keyboard.type("one");
			await page.keyboard.press("Enter");
			await page.keyboard.type("two");
			await expect(page.getByRole("listitem")).toHaveCount(2);
			await expect(page.getByRole("list")).toHaveCount(1);

			// Now we indent 2. so it looks like and there should be two lists
			// 1. one
			//   1. two
			await page.keyboard.press("ControlOrMeta+]");
			await expect(page.getByRole("list")).toHaveCount(2);

			// Press enter then backspace so that we get this:
			// 1. one
			//   1. two
			//      more stuff
			await page.keyboard.press("Enter");
			await page.keyboard.press("Backspace");
			await page.keyboard.type("more stuff");
			await expect(page.getByRole("listitem").nth(1)).toContainText("two");
			await expect(page.getByRole("listitem").nth(1)).toContainText("more stuff");
		});
	}
});
