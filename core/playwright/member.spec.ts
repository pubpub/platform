import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { MembersPage } from "./fixtures/member-page";
import { createCommunity, inbucketClient, login } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

// test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();
	await login({ page });
	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Members", () => {
	let newUserEmail: string;

	test("Can add a new member", async () => {
		const membersPage = new MembersPage(page, COMMUNITY_SLUG);
		await membersPage.goto();

		const { email, firstName, lastName, isSuperAdmin, role } = await membersPage.addNewUser(
			faker.internet.email()
		);

		expect(email).toBeTruthy();
		expect(firstName).toBeTruthy();
		expect(lastName).toBeTruthy();
		expect(isSuperAdmin).toBe(false);
		expect(role).toEqual("editor");

		newUserEmail = email;

		await page.waitForTimeout(1000);
	});

	test("Can add an existing user", async () => {
		const membersPage = new MembersPage(page, COMMUNITY_SLUG);
		await membersPage.goto();

		await membersPage.addExistingUser("new@pubpub.org");

		await page.waitForTimeout(1000);
	});

	test("New user signup", async ({ page }) => {
		expect(newUserEmail).toBeTruthy();
		const firstPartOfEmail = newUserEmail.split("@")[0];
		const inviteEmail = await (
			await inbucketClient.getMailbox(firstPartOfEmail)
		).getLatestMessage(10);

		const joinLink = inviteEmail.message.body.text?.match(/(https?:\/\/.*?)\s/)?.[1]!;

		expect(joinLink).toBeTruthy();
		console.log(joinLink);

		await page.goto(joinLink);
		await page.waitForURL(/\/signup.*/);

		await page.locator("input[name='password']").fill("password");

		await page.click("button[type='submit']");

		await page.waitForURL(/\/settings/);

		await page.close();
	});

	test("User is not able to sign up twice", async ({ page }) => {
		const inviteEmail = await (
			await inbucketClient.getMailbox(newUserEmail.split("@")[0])
		).getLatestMessage(20);

		const joinLink = inviteEmail.message.body.text?.match(/(https?:\/\/.*?)\s/)?.[1]!;

		expect(joinLink).toBeTruthy();

		await page.goto(joinLink);
		await page.waitForURL(/\/signup/);

		page.getByText("This signup link has expired. Please request a new one.");
		await page.close();
	});

	test.fixme("User is able to change their first and last name on signup", async () => {});

	// Email address confirmation is not yet implemented
	test.fixme(
		"User needs to confirm their email address again if they change it during signup",
		async () => {}
	);
});
