/* eslint-disable no-console */
import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { Action } from "db/public";

import { FormsPage } from "./fixtures/forms-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubsPage } from "./fixtures/pubs-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity, inbucketClient, login } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;
const FORM_SLUG = `playwright-test-form-${now}`;
const ACTION_NAME = "Invite evaluator";
const firstName = faker.person.firstName();
const lastName = faker.person.lastName();
const email = `${firstName}@example.com`;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	await login({ page });
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
});

test.afterAll(async () => {
	await page.close();
});

test("Invite a user to fill out the form", async ({ browser }) => {
	const pubsPage = new PubsPage(page, COMMUNITY_SLUG);
	await pubsPage.goTo();
	const pubId = await pubsPage.createPub({
		stage: "Evaluating",
		values: { title: "The Activity of Snails" },
	});
	expect(pubId).toBeTruthy();

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
	await runActionDialog.getByRole("combobox").fill(email);

	const memberDialog = runActionDialog.getByRole("listbox", { name: "Suggestions", exact: true });
	await memberDialog
		.getByRole("button", {
			name: "Member not found Click to add a user to your community",
			exact: true,
		})
		.click();

	await memberDialog.getByLabel("First Name").fill(firstName);
	await memberDialog.getByLabel("Last Name").fill(lastName);
	await memberDialog.getByRole("button", { name: "Submit", exact: true }).click();
	await memberDialog
		.getByRole("option", {
			name: email,
			exact: true,
		})
		.click();

	await memberDialog.waitFor({ state: "hidden" });

	await runActionDialog
		.getByLabel("Email subject")
		.fill("Test invitation for :RecipientFirstName");
	await runActionDialog
		.getByLabel("Email body")
		.fill(`Please fill out :link[this form]{form=${FORM_SLUG}}`);

	await runActionDialog.getByRole("button", { name: "Run", exact: true }).click();
	await page.getByRole("status").filter({ hasText: "Action ran successfully!" }).waitFor();
	await runActionDialog.getByRole("button", { name: "Close", exact: true }).click();
	await runActionDialog.waitFor({ state: "hidden" });

	const { message } = await (await inbucketClient.getMailbox(firstName)).getLatestMessage();
	const url = message.body.html?.match(/a href="([^"]+)"/)?.[1];
	expect(url).toBeTruthy();

	// Use the browser to decode the html entities in our URL
	const decodedUrl = await page.evaluate((url) => {
		const elem = document.createElement("div");
		elem.innerHTML = url;
		return elem.textContent!;
	}, url!);

	// Open a new page so that we're no longer logged in as admin
	const newPage = await browser.newPage();
	await newPage.goto(decodedUrl);
	await newPage.getByText("Progress will be automatically saved").waitFor();

	await newPage.getByLabel(`${COMMUNITY_SLUG}:content`).fill("LGTM");

	// Make sure it autosaves
	await newPage.getByText("Last saved at").waitFor({ timeout: 6000 });

	await newPage.getByRole("button", { name: "Submit", exact: true }).click();

	await newPage.getByText("Form Successfully Submitted").waitFor();
});
