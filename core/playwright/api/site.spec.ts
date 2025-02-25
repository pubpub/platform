import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { PubTypesId, StagesId } from "db/public";

import { ApiTokenPage } from "../fixtures/api-token-page";
import { LoginPage } from "../fixtures/login-page";
import { PubTypesPage } from "../fixtures/pub-types-page";
import { StagesManagePage } from "../fixtures/stages-manage-page";
import { createCommunity } from "../helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

const TEST_STAGE_1 = "test stage" as const;
const TEST_STAGE_2 = "test stage 2" as const;

let testStage1Id: StagesId;
let testStage2Id: StagesId;

let testPubTypeId: PubTypesId;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const stagesPage = new StagesManagePage(page, COMMUNITY_SLUG);
	await stagesPage.goTo();
	const testStage1 = await stagesPage.addStage(TEST_STAGE_1);
	testStage1Id = testStage1.id;
	const testStage2 = await stagesPage.addStage(TEST_STAGE_2);
	testStage2Id = testStage2.id;

	const pubTypesPage = new PubTypesPage(page, COMMUNITY_SLUG);
	await pubTypesPage.goto();
	const testPubType = await pubTypesPage.addType("test pub type", "test pub type description", [
		`title`,
	]);
	testPubTypeId = testPubType.id;
});

test("should be able to create token with all permissions", async () => {
	const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
	await tokenPage.goto();
	const token = await tokenPage.createToken({
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
					stages: [testStage1Id],
					pubTypes: [testPubTypeId],
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
		stages: [testStage1Id],
		pubTypes: [testPubTypeId],
	});
});
