import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import type { UsersId } from "db/public";
import { CoreSchemaType, ElementType, InputComponent, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { seedCommunity } from "~/prisma/seed/seedCommunity";
import { FieldsPage } from "./fixtures/fields-page";
import { FormsEditPage } from "./fixtures/forms-edit-page";
import { FormsPage } from "./fixtures/forms-page";
import { LoginPage } from "./fixtures/login-page";
import { PubDetailsPage } from "./fixtures/pub-details-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { PubsPage } from "./fixtures/pubs-page";
import { createBaseSeed, PubFieldsOfEachType } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;
const jimothyId = crypto.randomUUID() as UsersId;
const crossUserId = crypto.randomUUID() as UsersId;

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
		admin: {},
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
	users: {
		jimothy: {
			id: jimothyId,
			role: MemberRole.admin,
		},
		cross: {
			id: crossUserId,
			existing: true,
			role: MemberRole.admin,
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;
let community2: CommunitySeedOutput<typeof seed2>;

test.beforeAll(async ({ browser }) => {
	community = await seedCommunity(seed);
	community2 = await seedCommunity(seed2);

	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation(community.users.admin.email, "password");
});
