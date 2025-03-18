// import { register } from "node:module";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import type { PubsId } from "db/public";
import { siteApi } from "contracts";
import { CoreSchemaType, MemberRole } from "db/public";

import { ApiTokenPage, expectStatus } from "./fixtures/api-token-page";
import { LoginPage } from "./fixtures/login-page";
import { createCommunity } from "./helpers";

let COMMUNITY_SLUG: string;

let page: Page;

let client: ReturnType<typeof initClient<typeof siteApi, any>>;

test.beforeAll(async ({ browser }) => {
	const { seedCommunity } = await import("~/seed/seedCommunity");

	const randomApiToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;

	const community = await seedCommunity(
		{
			community: {
				name: `test community ${Date.now()}`,
				slug: "test",
			},
			users: {
				admin: {
					password: "password",
					role: MemberRole.admin,
				},
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				Basic: {
					Title: { isTitle: true },
				},
			},
			pubs: [
				{
					pubType: "Basic",
					values: {
						Title: "what is up world",
					},
				},
			],
		},
		{
			withApiToken: randomApiToken,
		}
	);

	COMMUNITY_SLUG = community.community.slug;

	page = await browser.newPage();

	// const loginPage = new LoginPage(page);
	// await loginPage.goto();
	// await loginPage.loginAndWaitForNavigation();

	// await createCommunity({
	// 	page,
	// 	community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	// });

	// const apiTokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
	// await apiTokenPage.goto();
	// const token = await apiTokenPage.createToken({
	// 	name: "test token",
	// 	description: "test description",
	// 	permissions: true,
	// });

	client = initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${community.apiToken}`,
		},
	});
});

test.describe("Site API", () => {
	test.describe("pubs", () => {
		let newPubId: PubsId;
		test("should be able to create a pub", async () => {
			const pubTypesResponse = await client.pubTypes.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
			});

			expectStatus(pubTypesResponse, 200);
			expect(pubTypesResponse.body).toHaveLength(1);

			const pubType = pubTypesResponse.body[0];

			const pubResponse = await client.pubs.create({
				headers: {
					prefer: "return=representation",
				},
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				body: {
					pubTypeId: pubType.id,
					values: {
						[`${COMMUNITY_SLUG}:title`]: "Hello world",
					},
				},
			});

			expectStatus(pubResponse, 201);

			expect(pubResponse.body.values).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						fieldSlug: `${COMMUNITY_SLUG}:title`,
						value: "Hello world",
					}),
				])
			);

			newPubId = pubResponse.body.id;
		});

		test("should be able to retrieve a specific pub", async () => {
			expect(newPubId).toBeDefined();

			const response = await client.pubs.get({
				params: {
					communitySlug: COMMUNITY_SLUG,
					pubId: newPubId,
				},
				query: {},
			});

			expectStatus(response, 200);
			expect(response.body.id).toBe(newPubId);
		});
	});
});
