import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import type { PubsId, PubTypesId, StagesId } from "db/public";
import { siteApi } from "contracts";
import { NO_STAGE_OPTION } from "db/types";

import { ApiTokenPage, expectStatus } from "./fixtures/api-token-page";
import { LoginPage } from "./fixtures/login-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";
import { createCommunity } from "./helpers";

const now = new Date().getTime();
const COMMUNITY_SLUG = `playwright-test-community-${now}`;

let page: Page;

let client: ReturnType<typeof initClient<typeof siteApi, any>>;

const createClient = (token: string) =>
	initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
	});

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
	expect(token).not.toBeNull();

	client = createClient(token!);
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

	test.describe("restrictions", () => {
		let clientOnlyPubTypeClient: ReturnType<typeof createClient>;
		let clientOnlyStageClient: ReturnType<typeof createClient>;
		let clientBothClient: ReturnType<typeof createClient>;
		let clientNoStageClient: ReturnType<typeof createClient>;
		let testPubType1: PubTypesId;
		let testPubType2: PubTypesId;
		let testStage1: StagesId;
		let testStage2: StagesId;

		test.beforeAll(async () => {
			const pubTypesPage = new PubTypesPage(page, COMMUNITY_SLUG);
			await pubTypesPage.goto();
			const pubType1 = await pubTypesPage.addType(
				"test pub type",
				"test pub type description",
				[`title`]
			);
			testPubType1 = pubType1.id;
			const pubType2 = await pubTypesPage.addType(
				"test pub type 2",
				"test pub type description 2",
				[`title`]
			);
			testPubType2 = pubType2.id;

			const stagePage = new StagesManagePage(page, COMMUNITY_SLUG);
			await stagePage.goTo();
			const stage1 = await stagePage.addStage("test stage");
			testStage1 = stage1.id;
			const stage2 = await stagePage.addStage("test stage 2");
			testStage2 = stage2.id;

			const pubResponses = await Promise.all(
				[pubType1, pubType2].flatMap((pubType) =>
					[null, stage1, stage2].map((stage) =>
						client.pubs.create({
							headers: {
								prefer: "return=representation",
							},
							params: {
								communitySlug: COMMUNITY_SLUG,
							},
							body: {
								pubTypeId: pubType.id,
								stageId: stage?.id,
								values: {
									[`${COMMUNITY_SLUG}:title`]: `pubType: "${pubType.name}"; stage: "${stage?.name}"`,
								},
							},
						})
					)
				)
			);

			expect(pubResponses).toHaveLength(6);
			pubResponses.forEach((response) => {
				expectStatus(response, 201);
			});
		});

		test("if only pub type is restricted, only pubs of that pub type are returned", async () => {
			const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
			await tokenPage.goto();

			const onlyPubTypeToken = await tokenPage.createToken({
				name: "test token with pub type restriction",
				permissions: {
					pub: {
						read: {
							pubTypes: [testPubType1],
						},
						write: true,
					},
				},
			});

			clientOnlyPubTypeClient = createClient(onlyPubTypeToken!);

			const pubResponseRestricted = await clientOnlyPubTypeClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(3);
			expect(pubResponseRestricted.body.every((pub) => pub.pubTypeId === testPubType1)).toBe(
				true
			);
		});

		test("if only stage is restricted, only pubs of that stage are returned", async () => {
			const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
			const onlyStageToken = await tokenPage.createToken({
				name: "test token",
				permissions: {
					pub: {
						read: {
							stages: [testStage1],
						},
					},
				},
			});
			clientOnlyStageClient = createClient(onlyStageToken!);

			const pubResponseRestricted = await clientOnlyStageClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(2);
			expect(pubResponseRestricted.body.every((pub) => pub.stageId === testStage1)).toBe(
				true
			);
		});

		test("if both pub type and stage are restricted, only pubs of that pub type and stage are returned", async () => {
			const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
			const bothToken = await tokenPage.createToken({
				name: "test token with pub type and stage restriction",
				permissions: {
					pub: {
						read: {
							pubTypes: [testPubType1],
							stages: [testStage1],
						},
					},
				},
			});
			clientBothClient = createClient(bothToken!);

			const pubResponseRestricted = await clientBothClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(1);
			expect(pubResponseRestricted.body[0].pubTypeId).toBe(testPubType1);
			expect(pubResponseRestricted.body[0].stageId).toBe(testStage1);
		});

		test("if stage is restricted, we can still further filter by pub type", async () => {
			const pubResponseRestrictedToStage1FilteredByPubType1 =
				await clientOnlyStageClient.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {
						pubTypeId: testPubType1,
					},
				});

			expectStatus(pubResponseRestrictedToStage1FilteredByPubType1, 200);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body).toHaveLength(1);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body[0].pubTypeId).toBe(
				testPubType1
			);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body[0].stageId).toBe(
				testStage1
			);
		});

		test("if stages are restricted to pubs not in a stage ", async () => {
			const tokenPage = new ApiTokenPage(page, COMMUNITY_SLUG);
			const noStageToken = await tokenPage.createToken({
				name: "test token with no stage restriction",
				permissions: {
					pub: {
						read: {
							stages: ["no-stage"],
						},
					},
				},
			});
			clientNoStageClient = createClient(noStageToken!);

			const pubResponseRestricted = await clientNoStageClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(2);
			expect(pubResponseRestricted.body[0].stageId).toBe(null);
		});
	});
});
