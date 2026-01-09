import type { Page } from "@playwright/test"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { faker } from "@faker-js/faker"
import { expect, test } from "@playwright/test"

import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	InviteStatus,
	MemberRole,
} from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { LoginPage } from "./fixtures/login-page"
import { MembersPage } from "./fixtures/member-page"
import { PubDetailsPage } from "./fixtures/pub-details-page"
import { PubsPage } from "./fixtures/pubs-page"
import { inbucketClient } from "./helpers"

const ACTION_NAME_USER = "Invite evaluator (user)"
const ACTION_NAME_EMAIL = "Invite evaluator (email)"

const firstName1 = faker.person.firstName()
const lastName1 = faker.person.lastName()
const email1 = `${firstName1}@example.com`

const firstName2 = faker.person.firstName()
const lastName2 = faker.person.lastName()
const email2 = `${firstName2}@example.com`

const evalSlug = "evaluation"

test.describe.configure({ mode: "serial" })

let page: Page

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
			pubType: "Evaluation",
			values: {
				Title: "Evaluation of The Activity of Snails",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Evaluation",
			values: {
				Title: "Do not let anyone edit me",
			},
			stage: "Evaluating",
		},
		{
			pubType: "Submission",
			values: {
				Title: "The Activity of Snails",
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
	},
})
let community: CommunitySeedOutput<typeof seed>

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed)

	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")
	await page.goto(
		`/c/${community.community.slug}/public/forms/${community.forms.Evaluation.slug}/fill`
	)
})

test.afterAll(async () => {
	await page.close()
})

test.describe("Inviting a new user to fill out a form", () => {
	test("Admin can invite a new user and send them a form link with an email action", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		)
		await pubDetailsPage.goTo()
		await pubDetailsPage.runAction(ACTION_NAME_USER, async (runActionDialog) => {
			// Clear the default recipient email field
			await runActionDialog.getByLabel("Recipient Email").clear()
			// Invite a new user to fill out the form
			await runActionDialog.getByRole("combobox").fill(email1)

			const memberDialog = runActionDialog.getByRole("listbox", {
				name: "Suggestions",
				exact: true,
			})
			await memberDialog
				.getByRole("button", {
					name: "Member not found Click to add a user to your community",
					exact: true,
				})
				.click()

			await memberDialog.getByLabel("First Name").fill(firstName1)
			await memberDialog.getByLabel("Last Name").fill(lastName1)
			// TODO: figure out how to remove this timeout without making the test flaky
			await page.waitForTimeout(2000)
			await memberDialog.getByRole("button", { name: "Submit", exact: true }).click()
			await memberDialog
				.getByRole("option", {
					name: email1,
					exact: true,
				})
				.click()

			await memberDialog.waitFor({ state: "hidden" })

			await runActionDialog
				.getByRole("textbox", { name: "Subject" })
				.fill("Test invitation for :RecipientFirstName")
			await runActionDialog
				.getByRole("textbox", { name: "Body" })
				.fill(`Please fill out :link[this form]{form=${community.forms.Evaluation.slug}}`)
		})
	})
	// fails with large number of pubs in the db
	test("New user can fill out the form from the email link", async ({ browser }) => {
		const { message } = await (await inbucketClient.getMailbox(firstName1)).getLatestMessage()
		const url = message.body.html?.match(/a href="([^"]+)"/)?.[1]
		expect(url).toBeTruthy()

		// Use the browser to decode the html entities in our URL
		const decodedUrl = await page.evaluate((url) => {
			const elem = document.createElement("div")
			elem.innerHTML = url
			return elem.textContent!
		}, url!)

		// Open a new page so that we're no longer logged in as admin
		const newPage = await browser.newPage()
		await newPage.goto(decodedUrl)
		await newPage.getByText("Form will save every few seconds while editing").waitFor()

		await newPage.getByLabel("Content").fill("LGTM")

		// Make sure it autosaves
		// It should happen after 5s, but it seems to take ~6 usually
		await newPage.getByText("Last saved at").waitFor({ timeout: 15000 })

		await newPage.getByRole("button", { name: "Submit", exact: true }).click()

		await newPage.getByText("Form Successfully Submitted").waitFor()

		// Test authorization for new contributor
		const pubsPage = new PubsPage(newPage, community.community.slug)
		await pubsPage.goTo()
		// User should see the pubs page in the community they are a contributor of
		expect(newPage.url()).toMatch(/\/pubs$/)

		// Make sure they can't view the pubs page in other communities
		const unauthorizedPubsPage = new PubsPage(newPage, "starter")
		await unauthorizedPubsPage.goTo()
		await newPage.waitForURL(/\/settings$/)
		// expect(newPage.url()).toMatch(/\/settings$/);

		// Creating a pub without a pubId should not work
		const createFormUrl = decodedUrl.replace(`pubId%3D${community.pubs[0].id}`, "")

		// Expect 404 page
		await newPage.goto(createFormUrl)
		await expect(newPage.getByText("This page could not be found.")).toHaveCount(1)

		// Switch back to the admin user and grant a community contributor permission to this form,
		// which should let them access the create pub form
		const membersPage = new MembersPage(page, community.community.slug)
		await membersPage.goto()
		await membersPage.removeMember(email1)
		await membersPage.addExistingUser(email1, MemberRole.contributor, [
			community.forms.Evaluation.name,
		])

		await newPage.reload()
		await newPage.getByLabel("Title").fill("new pub")
		await newPage.getByRole("button", { name: "Submit", exact: true }).click()
		await newPage.getByText("Form Successfully Submitted").waitFor()

		// Try to sneakily swap out the pubId in our decoded url for a different pubId
		const swappedPubIdUrl = decodedUrl.replace(community.pubs[0].id, community.pubs[1].id)
		await newPage.goto(swappedPubIdUrl)
		// Expect 404 page
		await expect(newPage.getByText("This page could not be found.")).toHaveCount(1)
	})

	test("Invite fails if pub and form pub_types don't match", async () => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[2].id
		)
		await pubDetailsPage.goTo()

		await pubDetailsPage.runAction(
			ACTION_NAME_EMAIL,
			async (runActionDialog) => {
				await runActionDialog
					.getByRole("textbox", { name: "Body" })
					.fill(
						`Please fill out :link[this form]{form=${community.pubTypes.Evaluation.defaultForm.slug}}`
					)
			},
			false
		)
		await page.getByText("Failed to Send Email", { exact: true }).waitFor()
		await expect(
			page
				.getByLabel("Notifications (F8)")
				.getByText(
					"Invitation failed. The specified form is for Evaluation pubs but this pub's type is Submission"
				)
		).toBeVisible()
	})

	test("New user can be invited again through email field and should be redirectd to the form immediately", async ({
		browser,
	}) => {
		const pubDetailsPage = new PubDetailsPage(
			page,
			community.community.slug,
			community.pubs[0].id
		)
		await pubDetailsPage.goTo()
		await pubDetailsPage.runAction(ACTION_NAME_USER, async (dialog) => {
			await dialog.getByLabel("Recipient Email").fill(email1)
			await dialog
				.getByRole("textbox", { name: "Body" })
				.fill(`Please fill out :link[this form]{form=${community.forms.Evaluation.slug}}`)
		})

		const { message } = await (await inbucketClient.getMailbox(firstName1)).getLatestMessage()
		const url = message.body.html?.match(/a href="([^"]+)"/)?.[1]
		expect(url).toBeTruthy()

		// Use the browser to decode the html entities in our URL
		const decodedUrl = await page.evaluate((url) => {
			const elem = document.createElement("div")
			elem.innerHTML = url
			return elem.textContent!
		}, url!)
		expect(url).toBeTruthy()

		const newPage = await browser.newPage()
		await newPage.goto(decodedUrl)
		await newPage.waitForURL(/\/forms/)
	})

	// happy path
	test("Invites without creating a new user", async () => {
		await test.step("admin sends invite to non-existing user", async () => {
			const pubDetailsPage = new PubDetailsPage(
				page,
				community.community.slug,
				community.pubs[0].id
			)
			await pubDetailsPage.goTo()

			await pubDetailsPage.runAction(ACTION_NAME_EMAIL)
		})

		await test.step("user clicks link in email", async () => {
			const { message } = await (
				await inbucketClient.getMailbox(firstName2)
			).getLatestMessage()
			const url = message.body.html?.match(/a href="([^"]+)"/)?.[1]
			expect(url).toBeTruthy()

			// Use the browser to decode the html entities in our URL
			const decodedUrl = await page.evaluate((url) => {
				const elem = document.createElement("div")
				elem.innerHTML = url
				return elem.textContent!
			}, url!)

			await page.goto(decodedUrl)

			await page.waitForURL(/\/invite/)
		})
	})
})
