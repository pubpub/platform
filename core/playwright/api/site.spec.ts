import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { ApiTokenPage } from "../fixtures/api-token-page";
import { LoginPage } from "../fixtures/login-page";
import { createCommunity } from "../helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
	await tokenPage.goto();
	await tokenPage.createToken({
		// expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		name: "test token",
		permissions: {
			community: { read: true, write: true, archive: true },
			pub: { read: true, write: true, archive: true },
			stage: { read: true, write: true, archive: true },
			pubType: { read: true, write: true, archive: true },
			member: { read: true, write: true, archive: true },
		},
	});
});

test("token should exist", async () => {
	await expect(page.getByText("test token")).toBeVisible();
});
