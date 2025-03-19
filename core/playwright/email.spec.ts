import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { PubsId, UsersId } from "db/public";
import { Action, CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
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
		Evaluations: {
			schemaName: CoreSchemaType.Null,
			relation: true,
		},
		EvaluationManager: {
			schemaName: CoreSchemaType.MemberId,
		},
	},
	users: {
		admin: {
			id: "fd6d27d5-3d05-466b-906a-6b6dd29116e4" as UsersId,
			role: MemberRole.admin,
			password: "password",
			firstName: "Jill",
			lastName: "Admin",
		},
		user2: {
			role: MemberRole.contributor,
			password: "xxxx-xxxx",
		},
	},
	pubTypes: {
		Evaluation: {
			Title: { isTitle: true },
		},
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Evaluations: { isTitle: false },
			EvaluationManager: { isTitle: false },
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
			id: "98deab44-0c57-4bca-8941-e7f97ceeb471" as PubsId,
			pubType: "Evaluation",
			values: {
				Title: "Review of The Activity of Snails",
			},
		},
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
				Content: "",
				Evaluations: [
					{
						value: null,
						relatedPubId: "98deab44-0c57-4bca-8941-e7f97ceeb471" as PubsId,
					},
				],
				EvaluationManager: "fd6d27d5-3d05-466b-906a-6b6dd29116e4",
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
			community.pubs[1].id
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

test("Admin can include the name of a member on a related pub", async () => {
	const pubDetailsPage = new PubDetailsPage(page, community.community.slug, community.pubs[0].id);
	await pubDetailsPage.goTo();
	await pubDetailsPage.runAction(ACTION_NAME, async (runActionDialog) => {
		await runActionDialog
			.getByLabel("Recipient email address")
			.fill(community.users.user2.email);
		await runActionDialog.getByLabel("Email subject").fill("Hello");
		await runActionDialog
			.getByLabel("Email body")
			.fill(
				':value{field="test-community:EvaluationManager" firstName lastName rel="test-community:Evaluations"}'
			);
		const { message } = await (
			await inbucketClient.getMailbox(community.users.user2.email.split("@")[0])
		).getLatestMessage();
		expect(message.body.html?.trim()).toBe("<p>Jill Admin</p>");
	});
});
