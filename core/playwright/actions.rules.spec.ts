import type { Page } from "@playwright/test";

import test from "@playwright/test";

import { Action, CoreSchemaType, Event } from "db/public";

import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	page.on("console", async (msg) => {
		if (msg.type() === "error") {
			// eslint-disable-next-line no-console
			console.error("Error:", msg, msg.location());
		}
	});

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const stagesManagePage = new StagesManagePage(page, COMMUNITY_SLUG);
	await stagesManagePage.goTo();

	const stage = await stagesManagePage.addStage("Test");

	await stagesManagePage.goTo();

	await stagesManagePage.addAction("Test", Action.log, "Log 1");
	await stagesManagePage.goTo();
	await stagesManagePage.addAction("Test", Action.log, "Log 2");

	const pubsPage = new PubsPage(page, COMMUNITY_SLUG);

	await pubsPage.goTo();
	await pubsPage.createPub({
		pubType: "Submission",
		stage: "Test",
		values: {
			title: "Test",
		},
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("sequential rules", () => {
	test("can run sequential rule", async () => {
		const stagesManagePage = new StagesManagePage(page, COMMUNITY_SLUG);
		await stagesManagePage.goTo();

		await stagesManagePage.addRule("Test", {
			event: Event.actionSucceeded,
			actionInstanceName: "Log 1",
			watchedActionInstanceName: "Log 2",
		});
		await page.waitForTimeout(1_000);

		await page.getByRole("tab", { name: "Pubs", exact: true }).click();
		await page.getByRole("button", { name: "Run Action" }).first().click();

		await page.getByRole("button", { name: "Log 2" }).first().click();

		await page.getByRole("button", { name: "Run" }).first().click();

		await page.waitForTimeout(1000);

		await page.goto(`/c/${COMMUNITY_SLUG}/activity/actions`);

		await page.getByText("Log 1").waitFor();
		await page.getByText("Rule (Log 2 Succeeded)", { exact: true });
		await page.getByText("Log 2", { exact: true }).waitFor();

		const success = await page.getByText("success").all();
		test.expect(success).toHaveLength(2);
	});
});
