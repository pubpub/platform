import crypto from "crypto";

import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { PubsId, UsersId } from "db/public";
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
import { FieldsPage } from "./fixtures/fields-page";
import { LoginPage } from "./fixtures/login-page";

const ACTION_NAME_USER = "Invite evaluator (user)";
const ACTION_NAME_EMAIL = "Invite evaluator (email)";

const firstName1 = faker.person.firstName();
const lastName1 = faker.person.lastName();
const email1 = `${firstName1}@example.com`;

const firstName2 = faker.person.firstName();
const lastName2 = faker.person.lastName();
const email2 = `${firstName2}@example.com`;

const firstName3 = faker.person.firstName();
const lastName3 = faker.person.lastName();
const email3 = `${firstName3}@example.com`;

const firstName4 = faker.person.firstName();
const lastName4 = faker.person.lastName();
const email4 = `${firstName4}@example.com`;

const firstName5 = faker.person.firstName();
const lastName5 = faker.person.lastName();
const email5 = `${firstName5}@example.com`;

const firstName6 = faker.person.firstName();
const lastName6 = faker.person.lastName();
const email6 = `${firstName6}@example.com`;

const firstName7 = faker.person.firstName();
const lastName7 = faker.person.lastName();
const email7 = `${firstName7}@example.com`;

const evalSlug = "evaluation";
const communityFormSlug = "community-form";

test.describe.configure({ mode: "serial" });

let page: Page;

const invitedUserId = crypto.randomUUID() as UsersId;
const completedInviteUserId = crypto.randomUUID() as UsersId;

const pub1Id = crypto.randomUUID() as PubsId;

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
		completedInviteUser: {
			id: completedInviteUserId,
			role: MemberRole.contributor,
			password: "password",
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
			id: pub1Id,
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
		CommunityForm: {
			slug: communityFormSlug,
			pubType: "Submission",
			elements: [
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "Form Title",
					},
				},
			],
		},
	},
	invites: {
		expiredEmailInvite: {
			provisionalUser: {
				email: email1,
				firstName: firstName1,
				lastName: lastName1,
			},
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		},
		completedEmailInvite: {
			provisionalUser: {
				email: email3,
				firstName: firstName3,
				lastName: lastName3,
			},
			status: InviteStatus.completed,
			lastSentAt: new Date(),
		},
		acceptedYetNotCompletedUserInvite: {
			provisionalUser: {
				email: email7,
				firstName: firstName7,
				lastName: lastName7,
			},
			status: InviteStatus.accepted,
			communityFormSlugs: ["Evaluation"],
			lastSentAt: new Date(),
		},
		rejectedEmailInvite: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
			},
			status: InviteStatus.rejected,
			lastSentAt: new Date(),
		},
		revokedEmailInvite: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
			},
			status: InviteStatus.revoked,
			lastSentAt: new Date(),
		},
		createdEmailInvite: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
			},
			status: InviteStatus.created,
		},
		happyPathEmailInvite: {
			provisionalUser: {
				email: email2,
				firstName: firstName2,
				lastName: lastName2,
			},
			communityFormSlugs: ["Evaluation"],
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
		},
		expiredUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		},
		completedUserInvite: {
			userId: completedInviteUserId,
			status: InviteStatus.completed,
			lastSentAt: new Date(),
		},
		rejectedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.rejected,
			lastSentAt: new Date(),
		},
		revokedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.revoked,
			lastSentAt: new Date(),
		},
		createdUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.created,
		},
		happyPathUserInvite: {
			userId: invitedUserId,
			communityFormSlugs: ["Evaluation"],
			status: InviteStatus.pending,
			lastSentAt: new Date(),
		},
		rejectEmailInvite: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: firstName2,
				lastName: lastName2,
			},
			pubId: pub1Id,
			pubFormSlugs: ["Evaluation"],
			pubRole: MemberRole.contributor,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},

		pubLevelFormInvite: {
			provisionalUser: {
				email: email4,
				firstName: firstName4,
				lastName: lastName4,
			},
			pubId: pub1Id,
			pubFormSlugs: ["CommunityForm"],
			pubRole: MemberRole.contributor,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		adminRoleInvite: {
			provisionalUser: {
				email: email5,
				firstName: firstName5,
				lastName: lastName5,
			},
			communityRole: MemberRole.admin,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite1: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
			},
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite2: {
			provisionalUser: {
				email: email6,
				firstName: firstName6,
				lastName: lastName6,
			},
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		nearlyExpiredInvite: {
			provisionalUser: {
				email: `${faker.person.firstName()}@example.com`,
				firstName: firstName1,
				lastName: lastName1,
			},
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		},
	},
});

const seed2 = createSeed({
	community: {
		name: `test community 2`,
		slug: "test-community-2",
	},
	users: {
		invitee1: {
			id: invitedUserId,
			role: MemberRole.admin,
			password: "password",
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
let community2: CommunitySeedOutput<typeof seed2>;
let inviteBasePath: string;

test.beforeAll(async ({ browser }) => {
	// needs to be first bc invites in community1 refer to users in community2
	community2 = await seedCommunity(seed2);
	community = await seedCommunity(seed);
	page = await browser.newPage();

	inviteBasePath = `/c/${community.community.slug}/public/invite`;
});

const createInviteUrl = (inviteToken: string, redirectTo: string) => {
	const inviteUrl = `${inviteBasePath}?invite=${inviteToken}&redirectTo=${redirectTo}`;
	return inviteUrl;
};

test.afterAll(async () => {
	await page?.close();
});

const expectInvalidInvite = (inviteToken: string, page: Page) => {
	return {
		toShow: async (text: string) => {
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			expect(page.getByText(text)).toBeVisible({
				timeout: 2_000,
			});
		},
	};
};

test.describe("invalid invite scenarios", () => {
	test("no invite token provided", async () => {
		await page.goto(inviteBasePath);
		await expect(page).toHaveURL(inviteBasePath);

		await expect(page.getByText("no Invite Found")).toBeVisible({
			timeout: 2_000,
		});

		await expect(page.getByText("no invite was provided.")).toBeVisible();
	});

	test.describe("email invites", () => {
		test("expired invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.expiredEmailInvite.inviteToken,
				page
			).toShow("This invite has expired.");
		});

		test("already completed invite shows success message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.completedEmailInvite.inviteToken,
				page
			).toShow("This invite has already been completed.");
		});

		test("rejected invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.rejectedEmailInvite.inviteToken,
				page
			).toShow("You have already rejected this invite.");
		});

		test("revoked invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.revokedEmailInvite.inviteToken,
				page
			).toShow("This invite has been revoked.");
		});

		test("created but not sent invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.createdEmailInvite.inviteToken,
				page
			).toShow("This invite is not ready for use.");
		});
	});

	test.describe("user invites", () => {
		test("expired invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(community.invites.expiredUserInvite.inviteToken, page).toShow(
				"This invite has expired."
			);
		});

		test("already accepted invite shows success message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.completedUserInvite.inviteToken,
				page
			).toShow("This invite has already been completed.");
		});

		test("rejected invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(
				community.invites.rejectedUserInvite.inviteToken,
				page
			).toShow("You have already rejected this invite.");
		});

		test("revoked invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(community.invites.revokedUserInvite.inviteToken, page).toShow(
				"This invite has been revoked."
			);
		});

		test("created but not sent invite shows appropriate message", async ({ page }) => {
			await expectInvalidInvite(community.invites.createdUserInvite.inviteToken, page).toShow(
				"This invite is not ready for use."
			);
		});
	});
});

test.describe("email invite flow", () => {
	test("user accepting email invite should be able to signup and fill out form", async ({
		page,
	}) => {
		await test.step("user can go to invite page and see they are allowed to signup", async () => {
			const invite = community.invites.happyPathEmailInvite;
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			await page.getByText("Create account").waitFor({
				state: "visible",
				timeout: 1_000,
			});
		});

		await test.step("User can click create account and be redirected to signup page", async () => {
			await page.getByRole("button", { name: "Create account" }).click({
				timeout: 2_000,
			});
			await page.waitForURL(`**/public/signup**`);
		});

		await test.step("user will be shown error if they try to signup with a different email", async () => {
			await page.getByLabel("Email").fill(email1);
			await page.getByLabel("First name").fill(firstName1);
			await page.getByLabel("Last name").fill(lastName1);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			await page.getByText("Email does not match invite").first().waitFor({
				state: "visible",
				timeout: 1000,
			});

			// dismiss notification
			await page
				.getByRole("region", { name: "Notifications (F8)" })
				.getByRole("button")
				.click();
		});

		await test.step("user can signup with the correct email", async () => {
			await page.getByLabel("Email").fill(community.invites.happyPathEmailInvite.user.email);
			await page
				.getByLabel("First name")
				.fill(community.invites.happyPathEmailInvite.user.firstName);
			await page
				.getByLabel("Last name")
				.fill(community.invites.happyPathEmailInvite.user.lastName!);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`, {
				timeout: 10_000,
			});
		});

		await test.step("user can fill out form", async () => {
			await page.getByLabel("Title").fill("Test title");
			await page.getByLabel("Content").fill("Test content");
			await page.getByLabel("Email").fill(email2);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});
		await test.step.skip("user has correct permissions afterwards", async () => {});
	});

	test("user who did not complete signup can return to invite and complete it", async ({
		page,
		browser,
	}) => {
		const invite = community.invites.acceptedYetNotCompletedUserInvite;
		const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

		await page.goto(inviteUrl);

		await test.step("user can click create account and be redirected to signup page", async () => {
			await page.getByRole("link", { name: "Complete signup" }).click({
				timeout: 2_000,
			});
			await page.waitForURL(`**/public/signup**`, { timeout: 10_000 });
		});

		await test.step("user can signup with the correct email", async () => {
			await page
				.getByLabel("Email")
				.fill(community.invites.acceptedYetNotCompletedUserInvite.user.email);
			await page
				.getByLabel("First name")
				.fill(community.invites.acceptedYetNotCompletedUserInvite.user.firstName);
			await page
				.getByLabel("Last name")
				.fill(community.invites.acceptedYetNotCompletedUserInvite.user.lastName!);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`);
		});

		await test.step("user can fill out form", async () => {
			await page.getByLabel("Title").fill("Test title");
			await page.getByLabel("Content").fill("Test content");
			await page.getByLabel("Email").fill(email2);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});
	});

	test("user can return to completed invite and be redirected to form", async ({ page }) => {
		const invite = community.invites.completedUserInvite;
		const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

		await page.goto(inviteUrl);
		await expectInvalidInvite(invite.inviteToken, page).toShow(
			"This invite has already been completed."
		);

		await test.step("user can click login link and be redirected to form", async () => {
			await page.getByRole("link", { name: "Login to continue to destination" }).click({
				timeout: 2_000,
			});
			await page.waitForURL(`**/login**`);
			await page.getByLabel("Email").fill(community.invites.completedUserInvite.user.email);
			await page.getByLabel("Password").fill("password");
			await page.getByText("Sign In").click({ timeout: 2_000 });

			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`, {
				timeout: 10_000,
			});
		});

		await test.step("user is automatically redirected when returning to invite", async () => {
			await page.goto(inviteUrl);
			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`, {
				timeout: 10_000,
			});
		});
	});
});

test.describe("user invite flow", () => {
	test("wrong user is logged in, they log out, then accept as usual", async ({ page }) => {
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");

		await test.step("visit invite and see wrong account message", async () => {
			await expectInvalidInvite(
				community.invites.happyPathUserInvite.inviteToken,
				page
			).toShow("Wrong account");
		});

		await test.step("logout and login as invited user", async () => {
			await page.getByRole("button", { name: "Logout" }).click();
		});

		await test.step("revisit invite see correct message", async () => {
			await page.getByText("You've Been Invited", { exact: true }).waitFor({
				state: "visible",
				timeout: 5_000,
			});
		});

		await test.step("login as invited user", async () => {
			await page.getByRole("button", { name: "Log In" }).click({
				timeout: 2_000,
			});
			await page.waitForURL("**/login?**", { timeout: 5_000 });
			await page.getByLabel("Email").fill(community2.users.invitee1.email);
			await page.getByLabel("Password").fill("password");
			await page.getByText("Sign In").click({
				timeout: 2_000,
			});
			await page.waitForTimeout(1_000);
		});

		await test.step("get redirected back to invite, accept, then see correct form", async () => {
			await page.waitForURL(`**/public/invite?**`, { timeout: 5_000 });
			await page.getByRole("button", { name: "Accept" }).click({
				timeout: 2_000,
			});

			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`);

			await page.getByLabel("Title").fill("Test title");
			await page.getByLabel("Content").fill("Test content");
			await page.getByLabel("Email").fill(community.users.user2.email);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2_000,
			});
		});
	});
});

test.describe("invite reject flow", () => {
	test("user can reject a pending invite", async ({ page }) => {
		const invite = community.invites.rejectEmailInvite;
		await test.step("user can access invite page and see reject option", async () => {
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			await expect(page.getByRole("button", { name: "Reject" })).toBeVisible({
				timeout: 1000,
			});
		});

		await test.step("user can click reject and confirm rejection", async () => {
			await page.getByRole("button", { name: "Reject" }).click({
				timeout: 2000,
			});

			await page.getByRole("button", { name: "Reject" }).click({
				timeout: 2000,
			});

			await expect(page.getByText("You have rejected the invite")).toBeVisible({
				timeout: 1000,
			});
		});

		await test.step("Going back to the invite URL shows the rejected state", async () => {
			// Reload the page to verify the rejected state persists
			await expectInvalidInvite(invite.inviteToken, page).toShow(
				"You have already rejected this invite."
			);
		});
	});
});

test.describe("different form/invite types", () => {
	test("user can accept invite with pub level form", async () => {
		await test.step("user can access invite with pub level form", async () => {
			const invite = community.invites.pubLevelFormInvite;
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.CommunityForm.slug}/fill?pubId=${pub1Id}`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			await page.getByText("Create account").waitFor({
				state: "visible",
				timeout: 1000,
			});
		});

		await test.step("User can sign up", async () => {
			await page.getByRole("button", { name: "Create account" }).click({
				timeout: 2000,
			});
			await page.waitForURL(`**/public/signup**`);

			await page.getByLabel("Email").fill(email4);
			await page.getByLabel("First name").fill(firstName4);
			await page.getByLabel("Last name").fill(lastName4);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			// Should be redirected to the community form
			await page.waitForURL(`**/public/forms/${community.forms.CommunityForm.slug}/fill**`);
		});

		await test.step("User can fill out community form", async () => {
			// Fill out the community form, which has different fields
			await page.getByLabel("Form Title").fill("Community Test Title");
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});
	});
});

test.describe("different roles in invites", () => {
	test("user can accept invite with admin role", async () => {
		await test.step("user can access invite with admin role", async () => {
			const invite = community.invites.adminRoleInvite;
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			await page.getByText("Create account").waitFor({
				state: "visible",
				timeout: 1000,
			});
		});

		await test.step("user can sign up with admin invite", async () => {
			await page.getByRole("button", { name: "Create account" }).click({
				timeout: 2000,
			});
			await page.waitForURL(`**/public/signup**`);

			await page.getByLabel("Email").fill(email5);
			await page.getByLabel("First name").fill(firstName5);
			await page.getByLabel("Last name").fill(lastName5);
			await page.getByLabel("Password").fill("password");
			await page.getByTestId("signup-submit-button").click({
				timeout: 2000,
			});

			// Should be redirected to the form
			await page.waitForURL(`**/public/forms/${community.forms.Evaluation.slug}/fill**`);
		});

		await test.step("admin can fill out form", async () => {
			await page.getByLabel("Title").fill("Admin Test Title");
			await page.getByLabel("Content").fill("Content from admin");
			await page.getByLabel("Email").fill(email5);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});

		await test.step("Admin should have admin permissions in the community", async () => {
			const fieldsPage = new FieldsPage(page, community.community.slug);
			await fieldsPage.goto();
			await fieldsPage.addField(
				"Only an admin could have created this",
				CoreSchemaType.String
			);
		});
	});
});

test.describe.skip("multiple invites for same user", () => {
	test.skip("user with multiple pending invites can accept them in sequence", async () => {
		// This would test a user accepting multiple different invites one after another
		// Each giving different permissions or access to different forms
		// 1. Access first invite
		// 2. Sign up
		// 3. Verify access
		// 4. Access second invite
		// 5. Verify additional access gained
	});

	test.skip("user gets correct merged permissions when accepting multiple invites", async () => {
		// This would test that permissions are properly combined when a user
		// accepts multiple invites with different permission levels
	});
});

test.describe.skip("invite expiration handling", () => {
	test.skip("nearly expired invite allows user to request a new invite", async () => {
		// 1. User accesses an invite that's about to expire
		// 2. UI shows a warning about expiration
		// 3. User is given option to request a new invite
		// 4. System generates new invite with extended expiration
	});

	test.skip("user gets notification about upcoming invite expiration", async () => {
		// For invites attached to a user account, they should get notified
		// before the invite expires
	});

	test.skip("admin can see and extend expiring invites", async () => {
		// Test admin interface for managing and extending invite expirations
	});
});
