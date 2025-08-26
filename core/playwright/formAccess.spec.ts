import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { FormsId, PubsId, UsersId } from "db/public";
import { CoreSchemaType, ElementType, FormAccessType, InputComponent, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { db } from "~/lib/__tests__/db";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { LoginPage } from "./fixtures/login-page";
import { inbucketClient, PubFieldsOfEachType, waitForBaseCommunityPage } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;
const jimothyId = crypto.randomUUID() as UsersId;
const crossUserId = crypto.randomUUID() as UsersId;

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
				{
					type: ElementType.button,
					content: `Go see your pubs :link{page='currentPub' text='here'}`,
					label: "Submit",
					stage: "Evaluating",
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

const formIdThatllSneakilyBeSwitchedToPublic = crypto.randomUUID() as FormsId;

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
		becky: {
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
			id: formIdThatllSneakilyBeSwitchedToPublic,
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

test.describe("public signup cases", () => {
	test.describe("single community cases", () => {
		test("non-users are not able to signup for communities with private forms", async ({
			page,
		}) => {
			const response = await page.goto(`/c/${community2.community.slug}/public/signup`);
			expect(response?.status()).toBe(404);
		});

		test("non-users are able to access the public signup page for communities with public forms", async ({
			page,
		}) => {
			await page.goto(`/c/${community.community.slug}/public/signup`);
			await expect(page.getByRole("heading", { name: "Sign up" })).toBeVisible();
		});

		test("non-users are redirected to the signup page for public forms", async ({ page }) => {
			const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;

			const res = await page.goto(fillUrl);
			await page.waitForURL(
				`/c/${community.community.slug}/public/signup?redirectTo=${fillUrl}`,
				{ timeout: 10_000 }
			);
		});

		test("signed in community members should be redirected to base community page instead if no redirect is set", async ({
			page,
		}) => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.loginAndWaitForNavigation(
				community.users.baseMember.email,
				password,
				"pubs"
			);

			const res = await page.goto(`/c/${community.community.slug}/public/signup`);
			await waitForBaseCommunityPage(page, community.community.slug, "pubs");
		});
	});
});

test.describe("public forms", () => {
	test("non-users are able to signup for communities and fill out public forms", async ({
		page,
	}) => {
		const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		await test.step("non-users are able to access the public form", async () => {
			await page.goto(fillUrl);
			await page.waitForURL(
				`/c/${community.community.slug}/public/signup?redirectTo=${fillUrl}`
			);
			await page.getByRole("heading", { name: "Sign up" }).waitFor({ state: "visible" });
		});

		const testEmail = faker.internet.email();
		await test.step("non-users are able to signup for the community", async () => {
			await page.getByLabel("Email").fill(testEmail, {
				timeout: 1_000,
			});
			await page.getByLabel("Password").fill(password);
			await page.getByLabel("First Name").fill(faker.person.firstName());
			await page.getByLabel("Last Name").fill(faker.person.lastName());
			await page.getByRole("button", { name: "Sign up" }).click();
		});

		await test.step("non-users can verify their emails", async () => {
			await page.getByRole("heading", { name: "Verify your email" }).waitFor();
			const { message } = await (
				await inbucketClient.getMailbox(testEmail.split("@")[0])
			).getLatestMessage();
			const url = message.body.html?.match(/a href="([^"]+)"/)?.[1];
			expect(url).toBeTruthy();

			// Use the browser to decode the html entities in our URL
			const decodedUrl = await page.evaluate((url) => {
				const elem = document.createElement("div");
				elem.innerHTML = url;
				return elem.textContent!;
			}, url!);

			await page.goto(decodedUrl);
			await page.getByText("Your email is now verified", { exact: true }).waitFor();
			await page.waitForURL(fillUrl, { timeout: 5_000 });
		});

		let pubId: PubsId;
		await test.step("non-users are able to fill out the form", async () => {
			await page.getByLabel("Title").fill("Test Title");
			await page.getByLabel("Content").fill("Test Content");
			await page.getByRole("button", { name: "Submit" }).click();
			const submissionMessage = await page.getByText("Go see you").textContent({
				timeout: 2_000,
			});
			pubId = new URL(page.url()).searchParams.get("pubId") as PubsId;
		});

		await test.step("user should be able to access their pub through a link on the post submission message", async () => {
			await page.getByRole("link", { name: "here" }).click();
			await page.waitForURL(`**/pubs/${pubId}*`, { timeout: 10_000 });
		});

		await test.step("user should have been added as a contributor to the pub", async () => {
			const allTestEmails = await page.getByText(testEmail).all();
			expect(
				allTestEmails.length,
				"Expected 2 emails on the page, one for the user thingy and one for the contributor membership"
			).toBe(2);

			await page
				.getByText("contributor", {
					exact: true,
				})
				.waitFor({ state: "visible", timeout: 1_000 });
		});
	});

	test("users from a different community are able to fill out a public form", async ({
		page,
	}) => {
		await test.step("login as a user from a different community", async () => {
			const loginPage = new LoginPage(page);
			await loginPage.goto();
			await loginPage.loginAndWaitForNavigation(community2.users.jimothy.email, password);
		});

		const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		await test.step("user should be shown the join form", async () => {
			await page.goto(fillUrl);
			await page.waitForTimeout(1_000);
			await page.waitForURL(
				`/c/${community.community.slug}/public/signup?redirectTo=${fillUrl}`,
				{ timeout: 10_000 }
			);
			await page.getByRole("heading", { name: "Join" }).waitFor({ state: "visible" });
		});

		await test.step("user is able to instantly join the community and is redirected to the form", async () => {
			await page.getByRole("button", { name: `Join ${community.community.name}` }).click();
			await page
				.getByText(`You have joined ${community.community.name}`, { exact: true })
				.waitFor({
					state: "visible",
					timeout: 10_000,
				});
			await page.waitForURL(fillUrl, { timeout: 10_000 });
		});
	});
});

test.describe("public signup error cases", () => {
	test("should show error toast when trying to signup with existing email", async ({ page }) => {
		const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		const existingEmail = community.users.baseMember.email;

		await test.step("attempt signup with existing email", async () => {
			await page.goto(fillUrl);
			await page.getByLabel("Email").fill(existingEmail);
			await page.getByLabel("Password").fill(password);
			await page.getByLabel("First Name").fill(faker.person.firstName());
			await page.getByLabel("Last Name").fill(faker.person.lastName());
			await page.getByRole("button", { name: "Sign up" }).click();

			// error should be shown in toast
			const text = `Email ${existingEmail} is already taken`;
			await page
				.getByText(text, { exact: true })
				.waitFor({ state: "visible", timeout: 2_000 });
			// should stay on signup page
			await expect(page).toHaveURL(
				new RegExp(`/c/${community.community.slug}/public/signup`)
			);
		});
	});

	test("should show error toast when trying to join community that disables public signup", async ({
		page,
	}) => {
		const setFormAccess = async (formId: FormsId, access: FormAccessType) => {
			await db
				.updateTable("forms")
				.set({
					access,
				})
				.where("id", "=", formId)
				.execute();
		};

		try {
			await setFormAccess(community2.forms["Simple Private"].id, FormAccessType.public);

			// try to join community that has disabled public signups
			const privateFormUrl = `/c/${community2.community.slug}/public/forms/${community2.forms["Simple Private"].slug}/fill`;

			await test.step("attempt to join private community", async () => {
				await page.goto(privateFormUrl);

				await page.goto(privateFormUrl);
				await page.getByLabel("Email").fill(faker.internet.email());
				await page.getByLabel("Password").fill(password);
				await page.getByLabel("First Name").fill(faker.person.firstName());
				await page.getByLabel("Last Name").fill(faker.person.lastName());

				// now set form to private again
				await setFormAccess(community2.forms["Simple Private"].id, FormAccessType.private);

				await page.getByRole("button", { name: "Sign up" }).click();

				// error should be shown in toast
				await page
					.getByText(`Public signups are not allowed for ${community2.community.name}`, {
						exact: true,
					})
					.waitFor({ state: "visible", timeout: 2_000 });
				// should stay on join page
				await expect(page).toHaveURL(
					new RegExp(`/c/${community2.community.slug}/public/signup`)
				);
			});
		} finally {
			// "Rollback"
			await setFormAccess(community2.forms["Simple Private"].id, FormAccessType.public);
		}
	});

	test("person should be able to go to login page and then be redirected to the form", async ({
		page,
	}) => {
		const fillUrl = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		await test.step("go to form page and be redirected to signup page", async () => {
			await page.goto(fillUrl);
			await page.waitForURL(
				`/c/${community.community.slug}/public/signup?redirectTo=${fillUrl}`
			);
		});

		await test.step("click sign in button and be redirected login page", async () => {
			await page.getByRole("link", { name: "sign in" }).click();
			await page.waitForURL(`/login?redirectTo=${fillUrl}`);
		});

		await test.step("sign in and be redirected to the form", async () => {
			await page.getByLabel("Email").fill(community.users.baseMember.email);
			await page.getByLabel("Password").fill(password);
			await page.getByRole("button", { name: "Sign in" }).click();
			await page.waitForURL(fillUrl);
		});
	});
});
