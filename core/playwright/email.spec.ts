import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import { Action, CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/seed/createSeed";
import { createSeed } from "~/seed/createSeed";
import { seedCommunity } from "~/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { inbucketClient } from "./helpers";

const ACTION_NAME = "Send email";

test.describe.configure({ mode: "serial" });

let page: Page;

const seed = createSeed({
	community: {
		name: `test community`,
		slug: "test-community",
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
		Content: {
			schemaName: CoreSchemaType.String,
		},
	},
	users: {
		admin: {
			role: MemberRole.admin,
			password: "password",
		},
		user2: {
			role: MemberRole.contributor,
			password: "xxxx-xxxx",
		},
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {
			actions: {
				[ACTION_NAME]: {
					action: Action.email,
					name: ACTION_NAME,
					config: {
						subject: "Hello",
						body: "Greetings",
						recipientEmail: "test@example.com",
					},
				},
			},
		},
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

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Sending an email to an email address", () => {
	test("Admin can configure the email action to send to a static email address", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction(ACTION_NAME, async (runActionDialog) => {
			await runActionDialog
				.getByLabel("Recipient email address")
				.fill(community.users.user2.email);
			await runActionDialog.getByLabel("Email subject").fill("Hello");
			await runActionDialog.getByLabel("Email body").fill("Greetings");
		});
	});
	test("Static email address recipient recieves the email", async () => {
		const { message } = await (
			await inbucketClient.getMailbox(community.users.user2.email.split("@")[0])
		).getLatestMessage();
		expect(message.body.html?.trim()).toBe("<p>Greetings</p>");
	});
});
``;
