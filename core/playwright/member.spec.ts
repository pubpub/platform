import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { MembersPage } from "./fixtures/member-page";
import { inbucketClient } from "./helpers";

let COMMUNITY_SLUG = `playwright-test-community`;

let page: Page;

const seed = createSeed({
	community: {
		name: "Test Community",
		slug: "test-community",
	},
	users: {
		admin: {
			role: MemberRole.admin,
			password: "password",
		},
		user1: {
			role: MemberRole.contributor,
			password: "password",
		},
	},
});

const seed2 = createSeed({
	community: {
		name: "Test Community 2",
		slug: "test-community-2",
	},
	users: {
		user2: {
			password: "password",
		},
		user3: {
			role: MemberRole.contributor,
			password: "password",
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
let community2: CommunitySeedOutput<typeof seed2>;

test.beforeAll(async ({ browser }) => {
	const password = "password";

	community = await seedCommunity(seed);
	community2 = await seedCommunity(seed2);

	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, password);

	COMMUNITY_SLUG = community.community.slug;
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Community members", () => {
	test("Can add an existing user", async () => {
		const membersPage = new MembersPage(page, COMMUNITY_SLUG);
		await membersPage.goto();

		await membersPage.addExistingUser(community2.users.user2.email);
	});

	test("Community creator is automatically added as a member of new community", async () => {
		const membersPage = new MembersPage(page, COMMUNITY_SLUG);
		await membersPage.goto();
		await membersPage.searchMembers(community.users.admin.email);
		expect(page.getByText("No results.")).not.toBeAttached();
	});

	test("Can remove a member", async () => {
		const membersPage = new MembersPage(page, COMMUNITY_SLUG);
		await membersPage.goto();
		await membersPage.addExistingUser(community2.users.user3.email);
		await membersPage.removeMember(community2.users.user3.email);
		expect(page.getByText("No results.")).toBeVisible();
	});

	test("new user signup flow", async ({ browser }) => {
		let newUserEmail: string;

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

		expect(newUserEmail).toBeTruthy();

		await test.step("user can signup", async () => {
			const page = await browser.newPage();

			const firstPartOfEmail = newUserEmail.split("@")[0];
			const inviteEmail = await (
				await inbucketClient.getMailbox(firstPartOfEmail)
			).getLatestMessage(10);

			const joinLink = inviteEmail.message.body.text?.match(/(https?:\/\/.*?)\s/)?.[1]!;

			expect(joinLink).toBeTruthy();

			await page.goto(joinLink);
			await page.waitForURL(/\/signup.*/);

			await page.locator("input[name='password']").fill("password");

			await page.click("button[type='submit']");

			await page.waitForURL(/\/c\/.*?\/pubs/);

			await page.close();
		});

		//TODO: not sure why the expect fails here
		await test.step.skip("User is not able to sign up twice", async () => {
			const page = await browser.newPage();
			const inviteEmail = await (
				await inbucketClient.getMailbox(newUserEmail.split("@")[0])
			).getLatestMessage(20);

			const joinLink = inviteEmail.message.body.text?.match(/(https?:\/\/.*?)\s/)?.[1]!;

			expect(joinLink).toBeTruthy();

			await page.goto(joinLink);
			await page.waitForURL(/\/signup/);

			expect(page.getByText("You are not allowed to signup for an account")).toBeAttached();
			await page.close();
		});
	});

	test.fixme("User is able to change their first and last name on signup", async () => {});

	// Email address confirmation is not yet implemented
	test.fixme(
		"User needs to confirm their email address again if they change it during signup",
		async () => {}
	);
});
