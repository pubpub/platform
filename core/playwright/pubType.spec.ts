import type { Page } from "@playwright/test"
import type { PubsId } from "db/public"
import type { CommunitySeedOutput } from "~/prisma/seed/createSeed"

import { expect, test } from "@playwright/test"

import { CoreSchemaType, MemberRole } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { seedCommunity } from "~/prisma/seed/seedCommunity"
import { FieldsPage } from "./fixtures/fields-page"
import { LoginPage } from "./fixtures/login-page"
import { PubTypesEditPage } from "./fixtures/pub-types-edit-page"
import { PubTypesPage } from "./fixtures/pub-types-page"

let page: Page
let _pubId: PubsId

const seed = createSeed({
	community: { name: `test community`, slug: `test-community-slug` },
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		Submission: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	users: {
		admin: {
			password: "password",
			role: MemberRole.admin,
		},
	},
	stages: {
		Shelved: {},
		Submitted: {},
		"Ask Author for Consent": {},
		"To Evaluate": {},
	},
	stageConnections: {
		Submitted: {
			to: ["Ask Author for Consent"],
		},
		"Ask Author for Consent": {
			to: ["To Evaluate"],
		},
	},
	pubs: [
		{
			pubType: "Submission",
			stage: "Submitted",
			values: { Title: "The Activity of Snails", content: "Mostly crawling" },
		},
	],
})

let community: CommunitySeedOutput<typeof seed>

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed)

	page = await browser.newPage()

	const loginPage = new LoginPage(page)
	await loginPage.goto()
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password")
})

test.afterAll(async () => {
	await page.close()
})

test.describe("Pub types", () => {
	test("Can create a pub type", async () => {
		const pubTypesPage = new PubTypesPage(page, community.community.slug)
		await pubTypesPage.goto()
		await pubTypesPage.addType("Editor", "editor", ["title", "content"])
	})

	test("Can add relation field to pub type", async () => {
		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		await fieldsPage.addField("Contributor", CoreSchemaType.String, true)

		const pubTypesPage = new PubTypesPage(page, community.community.slug)
		await pubTypesPage.goto()
		const typeName = "Article"
		await pubTypesPage.addType(typeName, "article", ["title", "contributor"])

		await page.getByText(`${community.community.slug}:contributor`, { exact: true }).waitFor()
	})

	test("Can designate a field as the title", async () => {
		const fieldsPage = new FieldsPage(page, community.community.slug)
		await fieldsPage.goto()
		await fieldsPage.addField("description", CoreSchemaType.String)

		const typename = "Not Article"
		const pubTypesPage = new PubTypesPage(page, community.community.slug)
		await pubTypesPage.goto()
		const { id } = await pubTypesPage.addType(typename, "article", ["title", "description"])

		const pubTypesEditPage = new PubTypesEditPage(page, community.community.slug, id)

		await pubTypesEditPage.setAsTitleField("description")

		await expect(pubTypesEditPage.page.getByTestId(`remove-as-title-description`)).toBeVisible()

		await pubTypesEditPage.saveType()

		await pubTypesEditPage.goto()

		await expect(pubTypesEditPage.page.getByTestId(`remove-as-title-description`)).toBeVisible()
	})
})
