import { expect, test } from "@playwright/test";
import { getByRole } from "@testing-library/react";

const authFile = "playwright/.auth/user.json";

test("Evaluation email sending", async ({ page }) => {
	test.setTimeout(120000);
	/* Pattern for authentication. */
	await page.goto("/login");
	await page.getByLabel("email").fill("all@pubpub.org");
	await page.getByRole("textbox", { name: "password" }).fill("pubpub-all");
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.waitForURL("/c/unjournal/stages");

    /* Pattern for managing a eval*/
    await page.getByRole("button", { name: "Manage Evaluation" }).click();

	// can i query inbucket for the email?
	await page.context().storageState({ path: authFile });
});
