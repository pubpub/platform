import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { PubsId } from "db/public";
import { Action } from "db/public";

import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity, inbucketClient } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const ACTION_NAME = "Send email";
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
		await pubDetailsPage.runAction(ACTION_NAME, async (runActionDialog) => {
			await runActionDialog.getByLabel("Recipient email address").fill(email);
			await runActionDialog.getByLabel("Email subject").fill("Hello");
			await runActionDialog.getByLabel("Email body").fill("Greetings");
		});
	});
	test("Static email address recipient recieves the email", async () => {
		const { message } = await (await inbucketClient.getMailbox(firstName)).getLatestMessage();
		expect(message.body.html?.trim()).toBe("<p>Greetings</p>");
	});
});
``;
