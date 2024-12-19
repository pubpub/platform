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
const lastName = faker.person.lastName();
const email = `${firstName}@example.com`;

test.describe.configure({ mode: "serial" });

let page: Page;
let pubId: PubsId;
let pubId2: PubsId;

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
	await pubsPage.goTo();
	pubId2 = await pubsPage.createPub({
		stage: "Evaluating",
		values: { title: "Do not let anyone edit me" },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Inviting a new user to fill out a form", () => {
	test("Admin can invite a new user and send them a form link with an email action", async () => {
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

		const memberDialog = runActionDialog.getByRole("listbox", {
			name: "Suggestions",
			exact: true,
		});
		await memberDialog
			.getByRole("button", {
				name: "Member not found Click to add a user to your community",
				exact: true,
			})
			.click();

		await memberDialog.getByLabel("First Name").fill(firstName);
		await memberDialog.getByLabel("Last Name").fill(lastName);
		// TODO: figure out how to remove this timeout without making the test flaky
		await page.waitForTimeout(2000);
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
	});
	// fails with large number of pubs in the db
	test("New user can fill out the form from the email link", async ({ browser }) => {
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

		await newPage.getByLabel(`Content`).fill("LGTM");

		// Make sure it autosaves
		// It should happen after 5s, but it seems to take ~6 usually
		await newPage.getByText("Last saved at").waitFor({ timeout: 15000 });

		await newPage.getByRole("button", { name: "Submit", exact: true }).click();

		await newPage.getByText("Form Successfully Submitted").waitFor();

		// Test authorization for new contributor
		const pubsPage = new PubsPage(newPage, COMMUNITY_SLUG);
		await pubsPage.goTo();
		// User should be redirected to user settings page when viewing the pubs page in the
		// community they are a contributor of
		// This should fail/change we implement pub visibility checks
		expect(await newPage.url()).toMatch(/\/settings$/);

		// Make sure they can't view the pubs page in other communities
		const unauthorizedPubsPage = new PubsPage(newPage, "croccroc");
		await unauthorizedPubsPage.goTo();
		expect(await newPage.url()).toMatch(/\/settings$/);

		// Creating a pub without a pubId should work
		const createPage = decodedUrl.replace(`pubId%3D${pubId}`, "");
		await newPage.goto(createPage);
		await newPage.getByLabel(`${COMMUNITY_SLUG}:title`).fill("new pub");
		await newPage.getByRole("button", { name: "Submit", exact: true }).click();
		await newPage.getByText("Form Successfully Submitted").waitFor();

		// Try to sneakily swap out the pubId in our decoded url for a different pubId
		const swappedPubIdUrl = decodedUrl.replace(pubId, pubId2);
		await newPage.goto(swappedPubIdUrl);
		// Expect 404 page
		await expect(newPage.getByText("This page could not be found.")).toHaveCount(1);
	});
});
