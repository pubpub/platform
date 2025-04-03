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

let token: string;

const createClient = (token: string, jsonQuery: boolean = false) => {
	return initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
		jsonQuery,
	});
};

const randomApiToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
test.beforeAll(async ({ browser }) => {
	// register("../prisma/seed/stubs/module-loader.js", import.meta.url);
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

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
				Content: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				Basic: {
					Title: { isTitle: true },
				},
				NotSoBasic: {
					Title: { isTitle: true },
					Content: { isTitle: false },
				},
			},
			pubs: [
				{
					pubType: "Basic",
					values: {
						Title: "what is up world",
					},
				},
				{
					pubType: "NotSoBasic",
					values: {
						Title: "Redwall",
						Content: "time for a feast",
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
		let firstCreatedAt: Date;
		test("should be able to create a pub", async () => {
			const pubTypesResponse = await client.pubTypes.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubTypesResponse, 200);
			expect(pubTypesResponse.body).toHaveLength(2);

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

			firstCreatedAt = new Date();

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

		test("should be able to filter by createdAt", async () => {
			const response = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {
					filters: {
						createdAt: {
							$gte: firstCreatedAt,
						},
					},
				},
			});

			expectStatus(response, 200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].id).not.toBe(newPubId);
		});

		test("should be able to filter by without jsonQuery", async () => {
			const client = createClient(randomApiToken, false);
			const response = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {
					filters: {
						createdAt: {
							$gte: firstCreatedAt,
						},
					},
				},
			});

			expectStatus(response, 200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].id).not.toBe(newPubId);
		});

		test("should be able to filter by updatedAt", async () => {
			const updatedAtDate = new Date();
			const updatedPub = await client.pubs.update({
				params: {
					pubId: newPubId,
					communitySlug: COMMUNITY_SLUG,
				},
				body: {
					[`${COMMUNITY_SLUG}:title`]: "Updated title",
				},
			});

			const response = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {
					filters: {
						updatedAt: {
							$gte: updatedAtDate,
						},
					},
				},
			});
			expectStatus(response, 200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].id).toBe(newPubId);
			expect(response.body[0].values).toMatchObject([
				expect.objectContaining({
					fieldSlug: `${COMMUNITY_SLUG}:title`,
					value: "Updated title",
				}),
			]);
		});

		/**
		 * this is to test that ?filters[x][y]=z works
		 */
		test("should be able to filter by manually supplying query params", async () => {
			const response = await fetch(
				`http://localhost:3000/api/v0/c/${COMMUNITY_SLUG}/site/pubs?filters[createdAt][$gte]=${firstCreatedAt.toISOString()}`,
				{
					headers: {
						Authorization: `Bearer ${randomApiToken}`,
					},
				}
			);

			const responseBody = await response.json();

			expect(response.status).toBe(200);
			expect(responseBody).toHaveLength(1);
			expect(responseBody[0].id).not.toBe(newPubId);
		});

		test("should be able to filter by pubTypeIds", async () => {
			const pubTypesResponse = await client.pubTypes.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubTypesResponse, 200);
			const pubTypes = pubTypesResponse.body;
			expect(pubTypes).toHaveLength(2);
			const pubType = pubTypes.find((pt) => pt.name === "NotSoBasic");
			expect(pubType).toBeDefined();

			const response = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: { pubTypeId: pubType!.id },
			});
			expectStatus(response, 200);

			expect(response.body).toHaveLength(1);

			// Query for both pub types
			const response2 = await client.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: { pubTypeId: pubTypes.map((pt) => pt.id) },
			});
			expectStatus(response2, 200);
			// 2 from seed, 2 created in other tests above
			expect(response2.body).toHaveLength(4);
		});
	});
});
