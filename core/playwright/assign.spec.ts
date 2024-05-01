import { expect, test } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

test("Assigning members to a pub", async ({ page }) => {
	// move a pub to to evaluate or just add it there in seed???
	await page.goto("/c/unjournal/stages");
	await page.getByRole("button", { name: "Create stage" }).click();
	await page.getByRole("textbox", { name: "title" }).fill("Test stage");
	await page.getByRole("button", { name: "Create" }).click();
	await page.waitForURL("/c/unjournal/stages/test-stage");
	await page.context().storageState({ path: authFile });
});
