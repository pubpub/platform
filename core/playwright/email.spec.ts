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

const memberId = crypto.randomUUID();
const pubId = crypto.randomUUID();

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
			id: memberId as UsersId,
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
			id: pubId as PubsId,
			pubType: "Evaluation",
			values: {
				Title: "Review of The Activity of Snails",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
				Content: "",
				Evaluations: [
					{
						value: null,
						relatedPubId: pubId as PubsId,
					},
				],
				EvaluationManager: memberId,
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
			await runActionDialog.getByLabel("Recipient Email").fill(community.users.user2.email);
			await runActionDialog.getByLabel("Subject").fill("Hello");
			await runActionDialog.getByLabel("Body").fill("Greetings");
		});
	});
	test("Static email address recipient recieves the email", async () => {
		const { message } = await (
			await inbucketClient.getMailbox(community.users.user2.email.split("@")[0])
		).getLatestMessage();
		expect(message.body.html?.trim()).toBe("<p>Greetings</p>");
	});
});

test.describe("Sending an email containing a MemberId field from a related pub", () => {
	test("Admin can include the name of a member on a related pub", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction(ACTION_NAME, async (runActionDialog) => {
			await runActionDialog.getByLabel("Recipient Email").fill(community.users.user2.email);
			await runActionDialog.getByLabel("Subject").fill("Hello");
			await runActionDialog
				.getByLabel("Body")
				.fill(
					`:value{field="${community.pubFields.EvaluationManager.slug}" firstName lastName rel="${community.pubFields.Evaluations.slug}"}`
				);
		});
	});
	test("Email recipient sees the member name", async () => {
		const { message } = await (
			await inbucketClient.getMailbox(community.users.user2.email.split("@")[0])
		).getLatestMessage();
		expect(message.body.html?.trim()).toBe("<p><span>Jill Admin</span></p>");
	});
});
