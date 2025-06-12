import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";

const clickNode = async (page: Page, name: string, nth: number = 0) => {
	await page.locator(".ProseMirror").getByRole("button", { name }).nth(nth).click();
};

test.describe("attribute panel", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(BLANK_EDITOR_STORY);
		const editor = page.locator(".ProseMirror");
		await editor.click();
	});

	test.describe("nodes", () => {
		test("can open and close the panel on a node", async ({ page }) => {
			await test.step("add a paragraph and open panel", async () => {
				await page.getByRole("button", { name: "paragraph" }).click();
				await page.getByTestId("attribute-panel").waitFor();
			});

			await test.step("fill out panel while keeping it open", async () => {
				const id = "test id";
				const className = "test class";
				await page.getByTestId("advanced-options-trigger").click();
				await page.getByTestId("id-input").fill(id);
				await page.getByTestId("class-input").fill(className);
			});

			await test.step("can close the panel by clicking the button again", async () => {
				await page.getByRole("button", { name: "paragraph" }).click();
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can close a node panel by clicking on text content", async ({ page }) => {
			const text = "example";
			await test.step("add a paragraph and open panel", async () => {
				await page.locator(".ProseMirror").pressSequentially(text);
				await clickNode(page, "paragraph");
				await page.getByTestId("attribute-panel").waitFor();
			});

			await test.step("click on other text", async () => {
				await page
					.locator(".ProseMirror")
					.getByText(text)
					.click({ position: { x: 0, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can switch to a mark attribute panel", async ({ page }) => {
			const text = "example";
			await test.step("add a paragraph fill in node attributes", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await page.locator(".ProseMirror").pressSequentially(text);
				await clickNode(page, "paragraph");
				const panel = page.getByTestId("attribute-panel");
				await panel.waitFor();
				await expect(panel).not.toContainText("strong");

				await page.getByTestId("advanced-options-trigger").click();
				const id = "paragraph-id";
				const idInput = page.getByTestId("id-input");
				await idInput.fill(id);
				await expect(idInput).toHaveValue(id);
				// click on the panel to blur the id input
				await panel.click();
			});

			await test.step("click on other text", async () => {
				// Add position to make sure we click inside the text
				// and just REALLY click it, apparently necessary. this does not happen in headful mode
				await page
					.locator(".ProseMirror")
					.getByText(text)
					.click({ position: { x: 20, y: 0 }, clickCount: 2 });

				await expect(page.getByTestId("attribute-panel")).toContainText("strong");
				await page.getByTestId("advanced-options-trigger").click();
				await expect(page.getByTestId("id-input")).toHaveValue("", { timeout: 1_000 });
			});
		});

		test("can switch between paragraph nodes", async ({ page }) => {
			const editor = page.locator(".ProseMirror");

			await test.step("create two paragraphs", async () => {
				await editor.pressSequentially("first");
				await editor.press("Enter");
				await editor.pressSequentially("second");
				await expect(page.getByRole("button", { name: "paragraph" })).toHaveCount(2);
			});

			await test.step("set attrs on first paragraph", async () => {
				await clickNode(page, "paragraph", 0);
				await page.getByTestId("attribute-panel").waitFor();
				const id = "id1";
				const className = "class1";
				await page.getByTestId("advanced-options-trigger").click();
				await page.getByTestId("id-input").fill(id);
				await page.getByTestId("class-input").fill(className);
			});

			await test.step("open panel on second paragraph", async () => {
				await clickNode(page, "paragraph", 1);
				// Make sure the second paragraph does not have the same attrs as the first
				await page.getByTestId("advanced-options-trigger").click();
				await expect(page.getByTestId("id-input")).toHaveValue("");
				await expect(page.getByTestId("class-input")).toHaveValue("");
			});
		});
	});

	test.describe("marks", () => {
		test("can open and close the marks panel via keyboard cursor", async ({ page }) => {
			const editor = page.locator(".ProseMirror");
			await test.step("cursor into a mark", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially("bold");
				await expect(page.getByTestId("attribute-panel")).toHaveCount(0);
				await editor.press("ArrowLeft");
				await page.getByTestId("attribute-panel").waitFor();
			});

			const suffix = "suffix";
			await test.step("add more non-mark'd text", async () => {
				await editor.press("ArrowRight");
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially(suffix);
			});

			await test.step("cursor back to mark to open the panel", async () => {
				for (let i = 0; i < suffix.length + 1; i++) {
					await page.keyboard.press("ArrowLeft");
				}
				await page.getByTestId("attribute-panel").waitFor();
			});
		});

		test("can close panel by clicking outside of the mark", async ({ page }) => {
			const editor = page.locator(".ProseMirror");
			const firstParagraph = "first";
			const secondParagraph = "second";
			await test.step("add bold mark and new (unbolded) node", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially(firstParagraph);
				await editor.press("Enter");
				await editor.pressSequentially(secondParagraph);
			});

			await test.step("click between the two to open and close the panel", async () => {
				await editor.getByText(firstParagraph).click({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor();
				await editor.getByText(secondParagraph).click({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can click between marks without overwriting attrs", async ({ page, browserName }) => {
			const editor = page.locator(".ProseMirror");

			await test.step("add bold mark and italic", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially("bold");
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially(" gap ");
				await page.getByRole("button", { name: "Italic" }).click();
				await editor.pressSequentially("italic");
			});

			await test.step("add attrs to italic", async () => {
				await editor.press("ArrowLeft");
				await page.getByTestId("attribute-panel").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await page.getByTestId("id-input").fill("italic-id");
			});

			await test.step("add attrs to bold", async () => {
				await editor.getByText("bold").dblclick({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await page.getByTestId("id-input").fill("bold-id");
			});

			await test.step("click between marks", async () => {
				const clickOptions =
					browserName === "chromium" ? { position: { x: 20, y: 0 } } : undefined;
				await editor.getByText("italic").dblclick(clickOptions);
				await page.getByTestId("attribute-panel").getByText("em").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await expect(page.getByTestId("id-input")).toHaveValue("italic-id");
				await editor.getByText("bold").dblclick(clickOptions);
				await page.getByTestId("attribute-panel").getByText("strong").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await expect(page.getByTestId("id-input")).toHaveValue("bold-id");
			});
		});

		/** This bug has been around for a while. when it is fixed, this test should pass */
		test.skip("marks of the same type do not have the same attributes", async ({ page }) => {
			const editor = page.locator(".ProseMirror");

			await test.step("add two separate bold instances", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially("first");
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially(" gap ");
				await page.getByRole("button", { name: "Bold" }).click();
				await editor.pressSequentially("second");
			});

			await test.step("add attrs to second", async () => {
				await editor.press("ArrowLeft");
				await page.getByTestId("attribute-panel").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await page.getByTestId("id-input").fill("second-id");
			});

			await test.step("make sure first does not have the same attr", async () => {
				await editor.getByText("first").click({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor();
				await page.getByTestId("advanced-options-trigger").click();
				await expect(page.getByTestId("id-input")).toHaveValue("");
			});
		});
	});
});
