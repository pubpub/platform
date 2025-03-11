import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { Action, CoreSchemaType, ElementType, InputComponent, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubsPage } from "./fixtures/pubs-page";
import { inbucketClient } from "./helpers";

const ACTION_NAME = "Invite evaluator";
const firstName = faker.person.firstName();
const lastName = faker.person.lastName();
const email = `${firstName}@example.com`;

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
			actions: [
				{
					action: Action.email,
					name: ACTION_NAME,
					config: {
						subject: "Hello",
						body: "Greetings",
						recipientEmail: "test@example.com",
					},
				},
			],
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
	],
	forms: {
		Evaluation: {
			slug: "evaluation",
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
});
let community: CommunitySeedOutput<typeof seed>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);

	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
	await page.goto(
		`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`
	);
});

test.afterAll(async () => {
	await page.close();
});

test.describe("Inviting a new user to fill out a form", () => {
	test("Admin can invite a new user and send them a form link with an email action", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		);
		await pubDetailsPage.goTo();
		await pubDetailsPage.runAction(ACTION_NAME, async (runActionDialog) => {
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
				.fill(`Please fill out :link[this form]{form=${community.forms.Evaluation.slug}}`);
		});
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

		await newPage.getByLabel("Content").fill("LGTM");

		// Make sure it autosaves
		// It should happen after 5s, but it seems to take ~6 usually
		await newPage.getByText("Last saved at").waitFor({ timeout: 15000 });

		await newPage.getByRole("button", { name: "Submit", exact: true }).click();

		await newPage.getByText("Form Successfully Submitted").waitFor();

		// Test authorization for new contributor
		const pubsPage = new PubsPage(newPage, community.community.slug);
		await pubsPage.goTo();
		// User should see the pubs page in the community they are a contributor of
		expect(newPage.url()).toMatch(/\/pubs$/);

		// Make sure they can't view the pubs page in other communities
		const unauthorizedPubsPage = new PubsPage(newPage, "croccroc");
		await unauthorizedPubsPage.goTo();
		expect(await newPage.url()).toMatch(/\/settings$/);

		// Creating a pub without a pubId should work
		const createPage = decodedUrl.replace(`pubId%3D${community.pubs[0].id}`, "");
		await newPage.goto(createPage);
		await newPage.getByLabel("Title").fill("new pub");
		await newPage.getByRole("button", { name: "Submit", exact: true }).click();
		await newPage.getByText("Form Successfully Submitted").waitFor();

		// Try to sneakily swap out the pubId in our decoded url for a different pubId
		const swappedPubIdUrl = decodedUrl.replace(community.pubs[0].id, community.pubs[1].id);
		await newPage.goto(swappedPubIdUrl);
		// Expect 404 page
		await expect(newPage.getByText("This page could not be found.")).toHaveCount(1);
	});
});
