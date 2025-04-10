import crypto from "crypto";

import type { Page } from "@playwright/test";

import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import type { PubsId, UsersId } from "db/public";
import type { Invite } from "db/types";
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

const evalSlug = "evaluation";
const communityFormSlug = "community-form";

test.describe.configure({ mode: "serial" });

let page: Page;

const invitedUserId = crypto.randomUUID() as UsersId;

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
			email: email1,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
		},
		acceptedEmailInvite: {
			email: email3,
			status: InviteStatus.accepted,
			lastSentAt: new Date(),
		},
		rejectedEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.rejected,
			lastSentAt: new Date(),
		},
		revokedEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.revoked,
			lastSentAt: new Date(),
		},
		createdEmailInvite: {
			email: `${faker.person.firstName()}@example.com`,
			status: InviteStatus.created,
		},
		happyPathEmailInvite: {
			email: email2,
			communityLevelFormSlugs: ["Evaluation"],
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
		acceptedUserInvite: {
			userId: invitedUserId,
			status: InviteStatus.accepted,
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
			communityLevelFormSlugs: ["Evaluation"],
			status: InviteStatus.pending,
			lastSentAt: new Date(),
		},
		rejectEmailInvite: {
			email: email2,
			pubId: pub1Id,
			pubOrStageFormSlugs: ["Evaluation"],
			pubOrStageRole: MemberRole.contributor,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},

		communityLevelFormInvite: {
			email: email4,
			communityLevelFormSlugs: ["CommunityForm"],
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		adminRoleInvite: {
			email: email5,
			communityRole: MemberRole.admin,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite1: {
			email: email6,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		multipleInvite2: {
			email: email6,
			communityRole: MemberRole.contributor,
			status: InviteStatus.pending,
			lastSentAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
		},
		nearlyExpiredInvite: {
			email: email1,
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
	await page.close();
});

const expectInvalidInvite = (inviteToken: string) => {
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

test.describe("Invalid invite scenarios", () => {
	test("No invite token provided", async () => {
		await page.goto(inviteBasePath);
		await expect(page).toHaveURL(inviteBasePath);

		await expect(page.getByText("No Invite Found")).toBeVisible({
			timeout: 2_000,
		});

		await expect(page.getByText("No invite was provided.")).toBeVisible();
	});

	test.describe("Email invites", () => {
		test("Expired invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.expiredEmailInvite.inviteToken).toShow(
				"This invite has expired."
			);
		});

		test("Already accepted invite shows success message", async () => {
			await expectInvalidInvite(community.invites.acceptedEmailInvite.inviteToken).toShow(
				"This invite has already been accepted."
			);
		});

		test("Rejected invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.rejectedEmailInvite.inviteToken).toShow(
				"You have already rejected this invite."
			);
		});

		test("Revoked invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.revokedEmailInvite.inviteToken).toShow(
				"This invite has been revoked."
			);
		});

		test("Created but not sent invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.createdEmailInvite.inviteToken).toShow(
				"This invite is not ready for use."
			);
		});
	});

	test.describe("User invites", () => {
		test("Expired invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.expiredUserInvite.inviteToken).toShow(
				"This invite has expired."
			);
		});

		test("Already accepted invite shows success message", async () => {
			await expectInvalidInvite(community.invites.acceptedUserInvite.inviteToken).toShow(
				"This invite has already been accepted."
			);
		});

		test("Rejected invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.rejectedUserInvite.inviteToken).toShow(
				"You have already rejected this invite."
			);
		});

		test("Revoked invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.revokedUserInvite.inviteToken).toShow(
				"This invite has been revoked."
			);
		});

		test("Created but not sent invite shows appropriate message", async () => {
			await expectInvalidInvite(community.invites.createdUserInvite.inviteToken).toShow(
				"This invite is not ready for use."
			);
		});
	});
});

test.describe("Email invite flow", () => {
	test("User accepting email invite should be able to signup and fill out form", async () => {
		await test.step("User can go to invite page and see they are allowed to signup", async () => {
			const invite = community.invites.happyPathEmailInvite;
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

test.describe("User invite flow", () => {
	// This test is more complex as it requires authentication setup
	test("Wrong user is logged in, they log out, then accept as usual", async () => {
		// login as admin
		const loginPage = new LoginPage(page);
		await loginPage.goto();
		await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");

		await test.step("Visit invite and see wrong account message", async () => {
			await expectInvalidInvite(community.invites.happyPathUserInvite.inviteToken).toShow(
				"Wrong account"
			);
		});

		await test.step("Logout and login as invited user", async () => {
			await page.getByRole("button", { name: "Logout" }).click();
		});

		await test.step("Revisit invite see correct message", async () => {
			await page.getByText("You've Been Invited", { exact: true }).waitFor({
				state: "visible",
				timeout: 5_000,
			});
		});

		await test.step("Login as invited user", async () => {
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

		await test.step("Get redirected back to invite, accept, then see correct form", async () => {
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

test.describe("Invite reject flow", () => {
	test("User can reject a pending invite", async () => {
		// Create a new invite that we can reject
		const invite = community.invites.rejectEmailInvite;
		await test.step("User can access invite page and see reject option", async () => {
			// Create a new invite that we can reject
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
			const inviteUrl = createInviteUrl(invite.inviteToken, redirectTo);

			await page.goto(inviteUrl);
			await expect(page).toHaveURL(inviteUrl);

			// Check that there's a reject button (this is dependent on the UI implementation)
			await expect(page.getByRole("button", { name: "Reject" })).toBeVisible({
				timeout: 1000,
			});
		});

		await test.step("User can click reject and confirm rejection", async () => {
			await page.getByRole("button", { name: "Reject" }).click({
				timeout: 2000,
			});

			// Assuming there's a confirmation dialog, confirm the rejection
			await page.getByRole("button", { name: "Reject" }).click({
				timeout: 2000,
			});

			// Check that we see a rejection confirmation message
			await expect(page.getByText("You have rejected the invite")).toBeVisible({
				timeout: 1000,
			});
		});

		await test.step("Going back to the invite URL shows the rejected state", async () => {
			// Reload the page to verify the rejected state persists
			await expectInvalidInvite(invite.inviteToken).toShow(
				"You have already rejected this invite."
			);
		});
	});
});

test.describe("Different form types", () => {
	test("User can accept invite with community-level form", async () => {
		await test.step("User can access invite with community-level form", async () => {
			const invite = community.invites.communityLevelFormInvite;
			const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.CommunityForm.slug}/fill`;
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
			await page.getByLabel("Rating (1-10)").fill("8");
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});
	});
});

test.describe("Different roles in invites", () => {
	test("User can accept invite with admin role", async () => {
		await test.step("User can access invite with admin role", async () => {
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

		await test.step("User can sign up with admin invite", async () => {
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

		await test.step("Admin can fill out form", async () => {
			await page.getByLabel("Title").fill("Admin Test Title");
			await page.getByLabel("Content").fill("Content from admin");
			await page.getByLabel("Email").fill(email5);
			await page.getByRole("button", { name: "Submit" }).click({
				timeout: 2000,
			});
		});

		await test.step.skip("Admin should have admin permissions in the community", async () => {
			// Would need to check admin-only pages/features to verify role
			// e.g., accessing admin dashboard or performing admin actions
		});
	});
});

test.describe("Multiple invites for same user", () => {
	test.skip("User with multiple pending invites can accept them in sequence", async () => {
		// This would test a user accepting multiple different invites one after another
		// Each giving different permissions or access to different forms
		// 1. Access first invite
		// 2. Sign up
		// 3. Verify access
		// 4. Access second invite
		// 5. Verify additional access gained
	});

	test.skip("User gets correct merged permissions when accepting multiple invites", async () => {
		// This would test that permissions are properly combined when a user
		// accepts multiple invites with different permission levels
	});
});

test.describe("Invite expiration handling", () => {
	test.skip("Nearly expired invite allows user to request a new invite", async () => {
		// 1. User accesses an invite that's about to expire
		// 2. UI shows a warning about expiration
		// 3. User is given option to request a new invite
		// 4. System generates new invite with extended expiration
	});

	test.skip("User gets notification about upcoming invite expiration", async () => {
		// For invites attached to a user account, they should get notified
		// before the invite expires
	});

	test.skip("Admin can see and extend expiring invites", async () => {
		// Test admin interface for managing and extending invite expirations
	});
});

test.describe("Invalid token", () => {
	test("Shows error for invalid token", async () => {
		const invalidToken = "invalid-token-that-doesnt-exist";
		const redirectTo = `/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`;
		const inviteUrl = createInviteUrl(invalidToken, redirectTo);

		await page.goto(inviteUrl);
		await expect(page).toHaveURL(inviteUrl);

		await expect(page.getByText("This invite link is invalid.")).toBeVisible({
			timeout: 1000,
		});
	});
});
