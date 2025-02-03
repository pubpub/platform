import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { PubsId } from "db/public";
import { Action } from "db/public";

import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity, inbucketClient } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;
const ACTION_NAME = "Invite evaluator";
const firstName = faker.person.firstName();
const email = `${firstName}@example.com`;

test.describe.configure({ mode: "serial" });

let page: Page;
let pubId: PubsId;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const formsPage = new FormsPage(page, COMMUNITY_SLUG);
	await formsPage.goto();
	await formsPage.addForm("Evaluation", FORM_SLUG);

	const stagesManagePage = new StagesManagePage(page, COMMUNITY_SLUG);
	await stagesManagePage.goTo();
	await stagesManagePage.addStage("Evaluating");
	await stagesManagePage.addAction("Evaluating", Action.email, ACTION_NAME);

	const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
	await pubsPage.goTo();
	pubId = await pubsPage.createPub({
		stage: "Evaluating",
		values: { title: "The Activity of Snails" },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Sending an email to an email address", () => {
	test("Admin can configure the email action to send to a static email address", async () => {
		const pubDetailsPage = new PubDetailsPage(page, COMMUNITY_SLUG, pubId!);
		await pubDetailsPage.goTo();

		await page.getByRole("button", { name: "Run action", exact: true }).click();
		await page
			.getByRole("menu", { name: "Run action", exact: true })
			.getByRole("button", { name: ACTION_NAME, exact: true })
			.click();

		const runActionDialog = page.getByRole("dialog", { name: ACTION_NAME, exact: true });
		await runActionDialog.waitFor();

		// Invite a new user to fill out the form
		await runActionDialog.getByLabel("Recipient email address").fill(email);
		await runActionDialog.getByLabel("Email subject").fill("Hello");
		await runActionDialog.getByLabel("Email body").fill("Greetings");

		await runActionDialog.getByRole("button", { name: "Run", exact: true }).click();
		await page.getByRole("status").filter({ hasText: "Action ran successfully!" }).waitFor();
		await runActionDialog.getByRole("button", { name: "Close", exact: true }).click();
		await runActionDialog.waitFor({ state: "hidden" });
	});
	// fails with large number of pubs in the db
	test("Static email address recipient recieves the email", async () => {
		const { message } = await (await inbucketClient.getMailbox(firstName)).getLatestMessage();
		expect(message.body.html).toBe("<p>Greetings</p>");
	});
});
