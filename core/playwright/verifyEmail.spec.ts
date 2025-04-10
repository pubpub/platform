import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { UsersId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { getUrlFromInbucketMessage, inbucketClient, PubFieldsOfEachType } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;
const jimothyId = crypto.randomUUID() as UsersId;
const joeId = crypto.randomUUID() as UsersId;

const communitySlug = `test-community-${new Date().getTime()}`;

const password = "password";
const seed = createSeed({
	community: {
		name: "test community",
		slug: communitySlug,
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
		Content: {
			schemaName: CoreSchemaType.String,
		},
		...PubFieldsOfEachType,
	},
	users: {
		admin: {
			role: MemberRole.admin,
			password,
		},
		unverifiedJim: {
			id: jimothyId,
			role: MemberRole.admin,
			password,
			isVerified: false,
		},
		unverifiedJoe: {
			id: joeId,
			role: MemberRole.admin,
			password,
			isVerified: false,
		},
		baseMember: {
			role: MemberRole.contributor,
			password,
		},
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {},
	},
	pubs: [
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
			},
			stage: "Evaluating",
		},
	],
});

let community: CommunitySeedOutput<typeof seed>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();
});

test.describe("unverified user", () => {
	test("can login and request another verification code", async ({ page }) => {
		await test.step("login", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.login(community.users.unverifiedJim.email, password);
			await page.waitForURL(`/verify`);
		});

		const firstVerification = await test.step("request another verification code", async () => {
			await page.getByRole("button", { name: "Resend verification email" }).click();
			await page.getByRole("button", { name: "Success" }).waitFor();
			const { message } = await (
				await inbucketClient.getMailbox(community.users.unverifiedJim.email.split("@")[0])
			).getLatestMessage();
			const url = await getUrlFromInbucketMessage(message, page);
			expect(url).toBeTruthy();
			return url;
		});

		const secondVerification =
			await test.step("request yet another verification code to invalidate the first", async () => {
				await page.getByRole("button", { name: "Success" }).click();
				// Wait so that the email gets a chance to send and we don't grab the original email
				await page.waitForTimeout(1_000);
				const { message } = await (
					await inbucketClient.getMailbox(
						community.users.unverifiedJim.email.split("@")[0]
					)
				).getLatestMessage();
				const url = await getUrlFromInbucketMessage(message, page);
				expect(url).toBeTruthy();
				return url;
			});

		expect(firstVerification).not.toEqual(secondVerification);

		await test.step("the first verification token should fail", async () => {
			await page.goto(firstVerification!);
			await page.getByText("Your token has expired.").waitFor();
		});

		await test.step("second verification should succeed", async () => {
			await page.goto(secondVerification!);
			await page
				.getByRole("status")
				.getByText("Your email is now verified", { exact: true })
				.waitFor();
		});
	});

	test("redirected to /verify page with redirect after signin", async ({ page }) => {
		const loginPage = new LoginPage(page);
		const redirect = "?redirectTo=/communities";
		// Manually go to a page with a redirect url
		await page.goto(`/login${redirect}`);
		await loginPage.login(community.users.unverifiedJoe.email, password);
		await page.getByText("Verify your email", { exact: true }).waitFor();
		await page.waitForURL(`/verify${redirect}`);
	});

	test("redirect url carries through after signing in and requesting a new link", async ({
		page,
	}) => {
		const redirect = "?redirectTo=/communities";
		await test.step("login with redirect", async () => {
			const loginPage = new LoginPage(page);
			await page.goto(`/login${redirect}`);
			await loginPage.login(community.users.unverifiedJoe.email, password);
			await page.getByText("Verify your email", { exact: true }).waitFor();
			await page.waitForURL(`/verify${redirect}`);
		});

		const url = await test.step("request a verification code", async () => {
			await page.getByRole("button", { name: "Resend verification email" }).click();
			await page.getByRole("button", { name: "Success" }).waitFor();
			const { message } = await (
				await inbucketClient.getMailbox(community.users.unverifiedJoe.email.split("@")[0])
			).getLatestMessage();
			const url = await getUrlFromInbucketMessage(message, page);
			expect(url).toBeTruthy();
			return url as string;
		});

		await test.step("link in email redirects to redirect link", async () => {
			await page.goto(url);
			await page.waitForURL("/communities**");
			await page
				.getByRole("status")
				.getByText("Your email is now verified", { exact: true })
				.waitFor();
		});
	});
});
