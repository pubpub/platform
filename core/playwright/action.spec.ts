import { expect, test } from "@playwright/test";
import { getByRole } from "@testing-library/react";

const authFile = "playwright/.auth/user.json";

test("Email action", async ({ page }) => {
	test.setTimeout(120000);
	/* Pattern for authentication. */
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL("/c/unjournal/stages");

	/* Pattern for creating actions test*/
	await page.goto("/c/unjournal/stages/manage");
	await page.getByRole("button", { name: "Under Evaluation" }).getByRole("link").click();
	const link = await page
		.getByRole("button", { name: "Under Evaluation" })
		.getByRole("link")
		.getAttribute("href");
	await expect(link).not.toBeNull();
	await page.goto(`${link}`);
	// assert that a panel came up with stage text
	await page.waitForSelector("text=Stage Name");
	await page.getByRole("tab", { name: "Actions" }).click();
	await page.waitForSelector(
		"text=Under Evaluation has no actions. Use the button below to add one."
	);
	await page.getByRole("button", { name: "Add an action" }).click();
	await page.getByRole("button", { name: "email" }).click();

	/* Pattern for running email action test */
	await page.waitForSelector("text=Actions");
	await page.getByLabel("edit-button").click();
	await page.getByLabel("Email address *").fill("test@rec.org");
	await page.getByLabel("Email subject *").fill("Did you receive this email?");
	await page.getByLabel("Email body *").fill("This, test email");
	await page.getByRole("button", { name: "Update config" }).click();
	await page.getByRole("tab", { name: "Pubs" }).click();
	await page.getByRole("button", { name: "Run action" }).click();
	await page.getByRole("button", { name: "email" }).click();
	await page.getByRole("button", { name: "Run" }).click();

	await expect(page.getByText("Action ran successfully!", { exact: true }));
	// can i query inbucket for the email?
	await page.context().storageState({ path: authFile });
});
