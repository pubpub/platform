import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { PubTypesId, StagesId } from "db/public";
import { MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { ApiTokenPage } from "../fixtures/api-token-page";
import { LoginPage } from "../fixtures/login-page";
import { createBaseSeed } from "../helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

const TEST_STAGE_1 = "test stage" as const;
const TEST_STAGE_2 = "test stage 2" as const;

let testStage1Id: StagesId;
let testStage2Id: StagesId;

let testPubTypeId: PubTypesId;
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
	pubTypes: {
		"test pub type": {
			Title: { isTitle: true },
		},
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	stages: {
		[TEST_STAGE_1]: {},
		[TEST_STAGE_2]: {},
	},
	pubs: [],
});
let community: CommunitySeedOutput<typeof seed>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});

test("should be able to create token with all permissions", async () => {
	const tokenPage = new ApiTokenPage(page, community.community.slug);
	await tokenPage.goto();
	const token = await tokenPage.createToken({
		name: "test token",
		permissions: {
			community: { read: true, write: true, archive: true },
			pub: { read: true, write: true, archive: true },
			stage: { read: true, write: true, archive: true },
			pubType: { read: true, write: true, archive: true },
			member: { read: true, write: true, archive: true },
		},
	});

	expect(token).not.toBeNull();

	await test.step("should be able to revoke token", async () => {
		const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
		await tokenPage.goto();
		await page.getByRole("button", { name: "Revoke token" }).first().click({ timeout: 1_000 });

		await page.getByRole("button", { name: "Remove" }).click();

		await expect(page.getByRole("button", { name: "Revoke token" })).toHaveCount(0);
	});
});

test("should be able to create token with special permissions", async () => {
	const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
	await tokenPage.goto();
	const token = await tokenPage.createToken({
		// expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		name: "test token with special permissions",
		permissions: {
			pub: {
				read: {
					stages: [community.stages[TEST_STAGE_1].id],
					pubTypes: [community.pubTypes["test pub type"].id],
				},
			},
		},
	});

	test.expect(token).not.toBeNull();

	await tokenPage.goto();

	await page.getByRole("button", { name: "Permissions" }).first().click();

	const permissionsText = await page.getByText("pub: read").textContent();

	const permissionContraints = permissionsText?.match(/\{.*\}/)?.[0];

	test.expect(permissionContraints).not.toBeNull();

	const permissionContraintsJson = JSON.parse(permissionContraints!);
	test.expect(permissionContraintsJson).toMatchObject({
		stages: [community.stages[TEST_STAGE_1].id],
		pubTypes: [community.pubTypes["test pub type"].id],
	});
	await expect(page.getByText("test token")).toBeVisible();
});
