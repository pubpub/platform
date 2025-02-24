import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import type { PubsId } from "db/public";
import { siteApi } from "contracts";

import { ApiTokenPage, expectStatus } from "./fixtures/api-token-page";
import { LoginPage } from "./fixtures/login-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

let page: Page;

let client: ReturnType<typeof initClient<typeof siteApi, any>>;

test.beforeAll(async ({ browser }) => {
	page = await browser.newPage();

	const loginPage = new LoginPage(page);
	await loginPage.goto();
	await loginPage.loginAndWaitForNavigation();

	await createCommunity({
		page,
		community: { name: `test community ${now}`, slug: COMMUNITY_SLUG },
	});

	const apiTokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
	await apiTokenPage.goto();
	const token = await apiTokenPage.createToken({
		name: "test token",
		description: "test description",
		permissions: true,
	});

	client = initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
		// necessary else filters will not work
		jsonQuery: true,
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

			const pubResponse2 = await client.pubs.create({
				headers: {
					prefer: "return=representation",
				},
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				body: {
					pubTypeId: pubType.id,
					values: {
						[`${COMMUNITY_SLUG}:title`]: "Goodbye world",
					},
				},
			});

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

		test("should be able to filter pubs", async () => {
			const response = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {
					filters: {
						[`${COMMUNITY_SLUG}:title`]: {
							$containsi: "hello",
						},
					},
				},
			});

			expectStatus(response, 200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].id).toBe(newPubId);

			const response2 = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {
					filters: {
						[`${COMMUNITY_SLUG}:title`]: {
							$containsi: "farewell",
						},
					},
				},
			});

			expectStatus(response2, 200);
			expect(response2.body).toHaveLength(0);
		});
	});
});
