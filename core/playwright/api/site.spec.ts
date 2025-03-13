import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { ApiTokenPage } from "../fixtures/api-token-page";
import { LoginPage } from "../fixtures/login-page";
import { createBaseSeed } from "../helpers";

test.describe.configure({ mode: "serial" });

let page: Page;

const baseSeed = createBaseSeed();
const seed = createSeed({
	...baseSeed,
	users: {
		admin: {
			...baseSeed.users!.admin,
			password: "password",
			isSuperAdmin: true,
			role: MemberRole.admin,
		},
	},
});
let community: CommunitySeedOutput<typeof seed>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});

test("token should exist", async () => {
	const tokenPage = new ApiTokenPage(page, community.community.slug);
	await tokenPage.goto();
	await tokenPage.createToken({
		name: "test token",
		permissions: {
			community: { read: true, write: true, archive: true },
			pub: { read: true, write: true, archive: true },
			stage: { read: true, write: true, archive: true },
			pubType: { read: true, write: true, archive: true },
			member: { read: true, write: true, archive: true },
		},
	});
	await expect(page.getByText("test token")).toBeVisible();
});
