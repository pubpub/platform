import type { BrowserContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { BLANK_EDITOR_STORY } from "./constants";

const clickNode = async (page: Page, browserName: string, name: string, nth: number = 0) => {
	// not sure why, but seem to have to click twice in tests when there
	// is already text on the page in Chrome. Only have to click once in the real thing though
	await page.locator(".ProseMirror").getByRole("button", { name }).nth(nth).click();
	if (browserName === "chromium") {
		await page.locator(".ProseMirror").getByRole("button", { name }).nth(nth).click();
	}
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
				await page.getByRole("textbox", { name: "id" }).fill(id);
				await page.getByRole("textbox", { name: "class" }).fill(className);
			});

			await test.step("can close the panel by clicking the button again", async () => {
				await page.getByRole("button", { name: "paragraph" }).click();
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can close a node panel by clicking on text content", async ({
			page,
			browserName,
		}) => {
			const text = "example";
			await test.step("add a paragraph and open panel", async () => {
				await page.locator(".ProseMirror").pressSequentially(text);
				await clickNode(page, browserName, "paragraph");
				await page.getByTestId("attribute-panel").waitFor();
			});

			await test.step("click on other text", async () => {
				// Firefox is finicky about the click position
				const clickOption =
					browserName === "firefox" ? { position: { x: 0, y: 0 } } : undefined;
				await page.locator(".ProseMirror").getByText(text).click(clickOption);
				await page.getByTestId("attribute-panel").waitFor({ state: "hidden" });
			});
		});

		test("can switch to a mark attribute panel", async ({ page, browserName }) => {
			const text = "example";
			await test.step("add a paragraph fill in node attributes", async () => {
				await page.getByRole("button", { name: "Bold" }).click();
				await page.locator(".ProseMirror").pressSequentially(text);
				await clickNode(page, browserName, "paragraph");
				await page.getByTestId("attribute-panel").waitFor();
				await expect(page.getByTestId("attribute-panel")).not.toContainText("strong");
				const id = "paragraph-id";
				await page.getByRole("textbox", { name: "id" }).fill(id);
				await expect(page.getByRole("textbox", { name: "id" })).toHaveValue(id);
			});

			await test.step("click on other text", async () => {
				// Add position to make sure we click inside the text
				await page
					.locator(".ProseMirror")
					.getByText(text)
					.click({ position: { x: 20, y: 0 } });
				await expect(page.getByTestId("attribute-panel")).toContainText("strong");
				await expect(page.getByRole("textbox", { name: "id" })).toHaveValue("");
			});
		});

		test("can switch between paragraph nodes", async ({ page, browserName }) => {
			const editor = page.locator(".ProseMirror");

			await test.step("create two paragraphs", async () => {
				await editor.pressSequentially("first");
				await editor.press("Enter");
				await editor.pressSequentially("second");
				await expect(page.getByRole("button", { name: "paragraph" })).toHaveCount(2);
			});

			await test.step("set attrs on first paragraph", async () => {
				await clickNode(page, browserName, "paragraph", 0);
				const id = "id1";
				const className = "class1";
				await page.getByRole("textbox", { name: "id" }).fill(id);
				await page.getByRole("textbox", { name: "class" }).fill(className);
			});

			await test.step("open panel on second paragraph", async () => {
				await clickNode(page, browserName, "paragraph", 1);
				// Make sure the second paragraph does not have the same attrs as the first
				await expect(page.getByRole("textbox", { name: "id" })).toHaveValue("");
				await expect(page.getByRole("textbox", { name: "class" })).toHaveValue("");
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
				await page.getByRole("textbox", { name: "id" }).fill("italic-id");
			});

			await test.step("add attrs to bold", async () => {
				await editor.getByText("bold").click({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor();
				await page.getByRole("textbox", { name: "id" }).fill("bold-id");
			});

			await test.step("click between marks", async () => {
				const clickOptions =
					browserName === "chromium" ? { position: { x: 20, y: 0 } } : undefined;
				await editor.getByText("italic").click(clickOptions);
				expect(page.getByRole("textbox", { name: "id" })).toHaveValue("italic-id");
				await editor.getByText("bold").click(clickOptions);
				expect(page.getByRole("textbox", { name: "id" })).toHaveValue("bold-id");
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
				await page.getByRole("textbox", { name: "id" }).fill("second-id");
			});

			await test.step("make sure first does not have the same attr", async () => {
				await editor.getByText("first").click({ position: { x: 20, y: 0 } });
				await page.getByTestId("attribute-panel").waitFor();
				await expect(page.getByRole("textbox", { name: "id" })).toHaveValue("");
			});
		});
	});
});
