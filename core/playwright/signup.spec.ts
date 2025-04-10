import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { Invites } from "db/public";
import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	InviteStatus,
	MemberRole,
} from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubsPage } from "./fixtures/pubs-page";
import { inbucketClient } from "./helpers";

const ACTION_NAME_USER = "Invite evaluator (user)";
const ACTION_NAME_EMAIL = "Invite evaluator (email)";

const firstName1 = faker.person.firstName();
const lastName1 = faker.person.lastName();
const email1 = `${firstName1}@example.com`;

const firstName2 = faker.person.firstName();
const lastName2 = faker.person.lastName();
const email2 = `${firstName2}@example.com`;

const evalSlug = "evaluation";

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
		Email: {
			schemaName: CoreSchemaType.Email,
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
		Evaluation: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Email: { isTitle: false },
		},
	},
	stages: {
		Evaluating: {
			actions: {
				[ACTION_NAME_USER]: {
					action: Action.email,
					config: {
						subject: "Hello",
						body: "Greetings",
						recipientEmail: email1,
					},
				},
				[ACTION_NAME_EMAIL]: {
					action: Action.email,
					config: {
						subject: "HELLO REVIEW OUR STUFF PLEASE... privately",
						recipientEmail: email2,
						body: `You are invited to fill in a form.\n\n\n\n:link{form="${evalSlug}" text="Wow, a great form!"}\n\n`,
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
		{
			pubType: "Submission",
			values: {
				Title: "Do not let anyone edit me",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Evaluation",
			values: {},
			stage: "Evaluating",
		},
	],
	forms: {
		Evaluation: {
			slug: evalSlug,
			pubType: "Evaluation",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Content",
					component: InputComponent.textArea,
					config: {
						label: "Content",
					},
				},
				{
					type: ElementType.pubfield,
					field: "Email",
					component: InputComponent.textInput,
					config: {
						label: "Email",
					},
				},
			],
		},
	},
	invites: {
		happyEmailInvite: {
			email: email2,
			pubOrStageFormSlugs: ["Evaluation"],
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
	},
});
let community: CommunitySeedOutput<typeof seed>;
let inviteBasePath: string;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();

	inviteBasePath = `/c/${community.community.slug}/public/invite`;
});

const createInviteUrl = (inviteToken: string, redirectTo: string) => {
	const inviteUrl = `${inviteBasePath}?invite=${inviteToken}&redirectTo=${redirectTo}`;
	return inviteUrl;
};

test.afterAll(async () => {
	await page.close();
});

test.describe("Email invite", () => {
	test("You should not be able to see anything if you are not logged in", async () => {
		await page.goto(inviteBasePath);
		await expect(page).toHaveURL(inviteBasePath);

		await expect(page.getByText("No Invite Found")).toBeVisible({
			timeout: 1000,
		});
	});

	test("User accepting email invite should be able to signup and fill out form", async () => {
		await test.step("User can go to invite page and see they are allowed to signup", async () => {
			const invite = community.invites.happyEmailInvite;
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			await page.getByText("Create account").waitFor({
				state: "visible",
				timeout: 1000,
			});
		});

		await test.step("User can click create account and be redirected to signup page", async () => {
			await page.getByRole("button", { name: "Create account" }).click({
				timeout: 2000,
			});
			await page.waitForURL(`**/public/signup**`);
		});

		await test.step("User will be shown error if they try to signup with a different email", async () => {
			await page.getByLabel("Email").fill(email1);
			await page.getByLabel("First name").fill(firstName1);
			await page.getByLabel("Last name").fill(lastName1);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			await page.getByText("Email does not match invite").waitFor({
				state: "visible",
				timeout: 1000,
			});
		});

		await test.step("User can signup with the correct email", async () => {
			await page.getByLabel("Email").fill(email2);
			await page.getByLabel("First name").fill(firstName2);
			await page.getByLabel("Last name").fill(lastName2);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`);
		});

		await test.step("User can fill out form", async () => {
			await page.getByLabel("Title").fill("Test title");
			await page.getByLabel("Content").fill("Test content");
			await page.getByLabel("Email").fill(email2);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});
		await test.step.skip("User has correct permissions afterwards", async () => {});
	});
});
