import { describe } from "node:test";

import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { UsersId } from "db/public";
import { CoreSchemaType, ElementType, FormAccessType, InputComponent, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { PubFieldsOfEachType, waitForBaseCommunityPage } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;
const jimothyId = crypto.randomUUID() as UsersId;
const crossUserId = crypto.randomUUID() as UsersId;

const password = "password";
const seed = createSeed({
	community: {
		name: "test community",
		slug: "test-community",
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
		cross: {
			id: crossUserId,
			role: MemberRole.admin,
			password,
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
		Evaluation: {
			Title: { isTitle: true },
			Content: { isTitle: false },
			Email: { isTitle: false },
		},
		"Title Only": {
			Title: { isTitle: true },
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
		{
			pubType: "Submission",
			values: {
				Title: "Do not let anyone edit me",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "I have a title and content",
				Content: "My content",
			},
			stage: "Evaluating",
		},
	],
	forms: {
		Evaluation: {
			slug: "evaluation",
			access: FormAccessType.public,
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
					field: CoreSchemaType.Email,
					component: InputComponent.textInput,
					config: {
						label: "Email",
					},
				},
			],
		},
		"Title Only (default)": {
			slug: "title-only-default",
			pubType: "Title Only",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
			],
		},
	},
});

const seed2 = createSeed({
	community: {
		name: "test community 2",
		slug: "test-community-2",
	},
	pubFields: {
		Title: {
			schemaName: CoreSchemaType.String,
		},
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
		},
	},
	users: {
		jimothy: {
			id: jimothyId,
			role: MemberRole.editor,
			password,
		},
		cross: {
			id: crossUserId,
			existing: true,
			role: MemberRole.admin,
			password,
		},
	},
	forms: {
		"Simple Private": {
			slug: "simple-private",
			pubType: "Submission",
			access: FormAccessType.private,
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Title",
					},
				},
			],
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
let community2: CommunitySeedOutput<typeof seed2>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);
	community2 = await seedCommunity(seed2);

	page = await browser.newPage();
});

describe("public signup ", () => {
	describe("single community cases", () => {
		test("non-users are not able to signup for communities with private forms", async () => {
			const response = await page.goto(`/c/${community2.community.slug}/public/signup`);
			expect(response?.status()).toBe(404);
		});

		test("non-users are able to access the public signup page for communities with public forms", async () => {
			await page.goto(`/c/${community.community.slug}/public/signup`);
			await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
		});

		test("signed in community members should be redirected to base community page instead if no redirect is set", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.loginAndWaitForNavigation(community.users.baseMember.email, password);

			const res = await page.goto(`/c/${community.community.slug}/public/signup`);
			await waitForBaseCommunityPage(page, community.community.slug);
		});

		test("non-users are redirected to the signup page for public forms", async () => {
			const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;

			const res = await page.goto(fillUrl);
			await page.waitForURL(
				`/c/${community.community.slug}/public/signup?redirectTo=${fillUrl}`
			);
		});
	});

	describe("cross community cases", () => {
		test("signed in users from outside the community should see a join form instead of a signup form", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.loginAndWaitForNavigation(community2.users.jimothy.email, password);

			await page.waitForTimeout(1_000);
			const signup = await page.goto(`/c/${community.community.slug}/public/signup`);
			await page.waitForURL(`/c/${community.community.slug}/public/signup`);
			await page.waitForTimeout(1_000);
			await page
				.getByRole("button", { name: `Join ${community.community.name}` })
				.waitFor({ state: "visible", timeout: 5_000 });

			test.step("users from outside the community should be able to join the community", async () => {
				await page
					.getByRole("button", { name: `Join ${community.community.name}` })
					.click();
				await page.waitForURL(`/c/${community.community.slug}`);
			});
		});
	});
});

describe("public forms", () => {
	test("non-users are able to signup for communityies and fill out public forms", async () => {
		test.step("non-users are able to access the public form", async () => {
			await page.goto(
				`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`
			);
			await page.waitForURL(`/c/${community.community.slug}/public/signup`);
		});

		test.step("non-users are able to signup for the community", async () => {
			await page.getByLabel("Email").fill(faker.internet.email());
			await page.getByLabel("Password").fill(password);
			await page.getByLabel("First Name").fill(faker.person.firstName());
			await page.getByLabel("Last Name").fill(faker.person.lastName());
			await page.getByRole("button", { name: "Sign up" }).click();
			await page.waitForURL(`/c/${community.community.slug}/stages`);
		});

		test.step("non-users are able to fill out the form", async () => {
			await page.getByLabel("Title").fill("Test Title");
			await page.getByLabel("Content").fill("Test Content");
			await page.getByRole("button", { name: "Submit" }).click();
		});
	});
});
