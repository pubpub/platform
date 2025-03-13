// import { register } from "node:module";

import type { APIRequestContext, Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import type { PubsId, PubTypesId, StagesId } from "db/public";
import { siteApi } from "contracts";
import { CoreSchemaType, MemberRole } from "db/public";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { ApiTokenPage, expectStatus } from "./fixtures/api-token-page";
import { PubTypesPage } from "./fixtures/pub-types-page";
import { StagesManagePage } from "./fixtures/stages-manage-page";

let COMMUNITY_SLUG: string;

let page: Page;

let client: ReturnType<typeof initClient<typeof siteApi, any>>;

const allToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const onlyPubTypeToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const onlyStageToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const bothToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const noStageToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;

const basicPubTypeId = `${crypto.randomUUID()}` as PubTypesId;
const testPubTypeId = `${crypto.randomUUID()}` as PubTypesId;
const testPubType2Id = `${crypto.randomUUID()}` as PubTypesId;
const testStage1Id = `${crypto.randomUUID()}` as StagesId;
const testStage2Id = `${crypto.randomUUID()}` as StagesId;

const pubTypeIds = [testPubTypeId, testPubType2Id];

const stageIds = [testStage1Id, testStage2Id, "no-stage" as const];

const pubsStagePubTypeCombinations = pubTypeIds.flatMap((pubTypeId, pubTypeIdIdx) =>
	stageIds.map((stageId, stageIdIdx) => {
		const pubName =
			`pubPubType${pubTypeIdIdx + 1}Stage${stageIdIdx > 1 ? "None" : stageIdIdx + 1}` as const;
		return {
			pubType: `Test Pub Type ${(pubTypeIdIdx + 1) as 1 | 2}` as const,
			stage: stageIdIdx > 1 ? null : (`Test Stage ${(stageIdIdx + 1) as 1 | 2}` as const),
			values: {
				Title: pubName,
			},
		};
	})
);

const seed = createSeed({
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
			id: basicPubTypeId,
			fields: {
				Title: { isTitle: true },
			},
		},
		"Test Pub Type 1": {
			id: testPubTypeId,
			fields: {
				Title: { isTitle: true },
			},
		},
		"Test Pub Type 2": {
			id: testPubType2Id,
			fields: {
				Title: { isTitle: true },
			},
		},
	},
	stages: {
		"Test Stage 1": {
			id: testStage1Id,
		},
		"Test Stage 2": {
			id: testStage2Id,
		},
	},
	pubs: [
		{
			pubType: "Basic",
			values: {
				Title: "what is up world",
			},
		},
		// @ts-expect-error Yeahyeah
		...pubsStagePubTypeCombinations,
	],
	apiTokens: {
		allToken: {
			id: allToken,
		},
		onlyPubTypeToken: {
			id: onlyPubTypeToken,
			permissions: {
				pub: {
					read: {
						pubTypes: [testPubTypeId],
						stages: stageIds,
					},
				},
			},
		},
		onlyStageToken: {
			id: onlyStageToken,
			permissions: {
				pub: {
					read: {
						pubTypes: pubTypeIds,
						stages: [testStage1Id],
					},
				},
			},
		},
		bothToken: {
			id: bothToken,
			permissions: {
				pub: {
					read: {
						pubTypes: [testPubTypeId],
						stages: [testStage1Id],
					},
				},
			},
		},
		noStageToken: {
			id: noStageToken,
			permissions: {
				pub: {
					read: {
						pubTypes: pubTypeIds,
						stages: ["no-stage"],
					},
				},
			},
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;

const createClient = (token: string) =>
	initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
	});

test.beforeAll(async ({ browser }) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

	community = await seedCommunity(seed);

	COMMUNITY_SLUG = community.community.slug;

	page = await browser.newPage();

	client = initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${allToken}`,
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
			expect(pubTypesResponse.body).toHaveLength(3);

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

		test("should be able to delete a pub", async () => {
			await expect(
				client.pubs.archive({
					params: {
						communitySlug: COMMUNITY_SLUG,
						pubId: newPubId,
					},
					body: null,
				})
			)
				// basically  because we don't return a body ts rest freaks out
				// TODO: fix this not really working
				.rejects.toThrow("Unexpected end of JSON input");
		});
	});

	test.describe("restrictions", () => {
		test("if only pub type is restricted, only pubs of that pub type are returned", async () => {
			const clientOnlyPubTypeClient = createClient(onlyPubTypeToken!);

			const pubResponseRestricted = await clientOnlyPubTypeClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(3);
			expect(pubResponseRestricted.body.every((pub) => pub.pubTypeId === testPubTypeId)).toBe(
				true
			);
		});

		test("if only stage is restricted, only pubs of that stage are returned", async () => {
			const clientOnlyStageClient = createClient(onlyStageToken!);

			const pubResponseRestricted = await clientOnlyStageClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(2);
			expect(pubResponseRestricted.body.every((pub) => pub.stageId === testStage1Id)).toBe(
				true
			);
		});

		test("if both pub type and stage are restricted, only pubs of that pub type and stage are returned", async () => {
			const clientBothClient = createClient(bothToken!);

			const pubResponseRestricted = await clientBothClient.pubs.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubResponseRestricted, 200);
			expect(pubResponseRestricted.body).toHaveLength(1);
			expect(pubResponseRestricted.body[0].pubTypeId).toBe(testPubTypeId);
			expect(pubResponseRestricted.body[0].stageId).toBe(testStage1Id);
		});

		test("if stage is restricted, we can still further filter by pub type", async () => {
			const clientOnlyStageClient = createClient(onlyStageToken!);

			const pubResponseRestrictedToStage1FilteredByPubType1 =
				await clientOnlyStageClient.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {
						pubTypeId: testPubTypeId,
					},
				});

			expectStatus(pubResponseRestrictedToStage1FilteredByPubType1, 200);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body).toHaveLength(1);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body[0].pubTypeId).toBe(
				testPubTypeId
			);
			expect(pubResponseRestrictedToStage1FilteredByPubType1.body[0].stageId).toBe(
				testStage1Id
			);
		});

		test("if stages are restricted to pubs not in a stage ", async () => {
			const clientNoStageClient = createClient(noStageToken);

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
