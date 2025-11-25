import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { test } from "@playwright/test"

import { CoreSchemaType, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { LoginPage } from "./fixtures/login-page"

let _COMMUNITY_SLUG = `playwright-test-community`

const seed = createSeed({
	community: {
		name: `test community`,
		slug: "test-community",
	},
	pubFields: {
		Title: {
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
			password: "password",
		},
		user3: {
			role: MemberRole.contributor,
			password: "password",
		},
		user4: {
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
			members: {
				user4: MemberRole.contributor,
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
			members: {
				user3: MemberRole.contributor,
			},
		},
	],
})

let community: CommunitySeedOutput<typeof seed>
test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed)

	_COMMUNITY_SLUG = community.community.slug
})

test.describe("Community members", () => {
	test("Admin or editor gets redirected to stages page", async ({ page }) => {
		const loginPage = new LoginPage(page)
		await loginPage.goto()
		await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")
	})

	test("Contributor with no pubs nor stages gets redirected to pubs page", async ({ page }) => {
		const loginPage = new LoginPage(page)
		await loginPage.goto()
		await loginPage.loginAndWaitForNavigation(community.users.user2.email, "password", "pubs")
	})

	test("Contributor with pub in stage gets redirected to pub page", async ({ page }) => {
		const loginPage = new LoginPage(page)
		await loginPage.goto()
		await loginPage.loginAndWaitForNavigation(community.users.user3.email, "password", "pubs")
	})

	test("Contributor with stages gets redirected to stages page", async ({ page }) => {
		const loginPage = new LoginPage(page)
		await loginPage.goto()
		await loginPage.loginAndWaitForNavigation(community.users.user4.email, "password")
	})
})
