import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import { siteApi } from "contracts";

import { ApiTokenPage, expectStatus } from "./fixtures/api-token-page";
import { LoginPage } from "./fixtures/login-page";
import { createCommunity } from "./helpers";

const authFile = "playwright/.auth/user.json";

const defaultToken = "xxxxxxxxxxxxxxxx.00000000-0000-0000-0000-000000000000";

let context: APIRequestContext;
const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

// test.describe.configure({ mode: "serial" });

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

	// context = await request.newContext({
	// 	baseURL: `http://localhost:3000/api/v0/c/${COMMUNITY_SLUG}/site/`,
	// 	extraHTTPHeaders: {
	// 		Authorization: `Bearer ${token}`,
	// 	},
	// });

	client = initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
	});
});

test.describe("Site API", () => {
	test("should be able to make a basic request", async () => {
		const response = await client.pubs.getMany({
			params: {
				communitySlug: COMMUNITY_SLUG,
			},
			query: {},
		});

		expect(response.status).toBe(200);

		// no pubs have been defined yet
		expect(response.body).toEqual([]);
	});

	test("should be able to create a pub", async () => {
		const pubTypesResponse = await client.pubTypes.getMany({
			params: {
				communitySlug: COMMUNITY_SLUG,
			},
		});

		expectStatus(pubTypesResponse, 200);
		// expect(pubTypesResponse.status).toBe(200);
		expect(pubTypesResponse.body).toHaveLength(1);

		const pubType = pubTypesResponse.body[0];

		const pubResponse = await client.pubs.create({
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

		console.log(pubResponse);

		expectStatus(pubResponse, 204);
		expect(pubResponse.body.values).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					fieldSlug: `${COMMUNITY_SLUG}:title`,
					value: "Hello world",
				}),
			])
		);
	});
});
