import { expect, test } from "@playwright/test";


test("Assigning members to a stage", async ({ page }) => {
	await page.goto("/c/unjournal/stages");
	await page.getByRole("button", { name: "Create stage" }).click();
	await page.getByRole("textbox", { name: "title" }).fill("Test stage");
	await page.getByRole("button", { name: "Create" }).click();
	await page.waitForURL("/c/unjournal/stages/test-stage");
});
