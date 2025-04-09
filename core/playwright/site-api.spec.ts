// import { register } from "node:module";

import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { initClient } from "@ts-rest/core";

import type { PubsId, PubTypesId, StagesId } from "db/public";
import { siteApi } from "contracts";
import { CoreSchemaType, MemberRole } from "db/public";
import { sleep } from "utils";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { createSeed } from "~/prisma/seed/createSeed";
import { expectStatus } from "./fixtures/api-token-page";

let COMMUNITY_SLUG: string;

let page: Page;

let client: ReturnType<typeof initClient<typeof siteApi, any>>;

const allToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const onlyTestPubType1Token = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const onlyStageToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const bothToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const noStageToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;
const testPubType1AndBasicPubTypeToken = `${crypto.randomUUID()}.${crypto.randomUUID()}` as const;

const basicPubTypeId = `${crypto.randomUUID()}` as PubTypesId;
const testPubTypeId = `${crypto.randomUUID()}` as PubTypesId;
const testPubType2Id = `${crypto.randomUUID()}` as PubTypesId;
const testStage1Id = `${crypto.randomUUID()}` as StagesId;
const testStage2Id = `${crypto.randomUUID()}` as StagesId;

const testPubTypeIds = [testPubTypeId, testPubType2Id];
const allPubTypeIds = [basicPubTypeId, ...testPubTypeIds];

const testStageIds = [testStage1Id, testStage2Id, "no-stage" as const];

const whatIsUpWorldPubId = `${crypto.randomUUID()}` as PubsId;

/**
 * We create a pub for each pub type and stage combination
 */
const pubsStagePubTypeCombinations = testPubTypeIds.flatMap((pubTypeId, pubTypeIdIdx) =>
	testStageIds.map((stageId, stageIdIdx) => {
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
		Relation: { schemaName: CoreSchemaType.Null, relation: true },
		Content: { schemaName: CoreSchemaType.String },
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
		NotSoBasic: {
			Title: { isTitle: true },
			Content: { isTitle: false },
		},
	},
	stages: {
		"Test Stage 1": {
			id: testStage1Id,
		},
		"Test Stage 2": {
			id: testStage2Id,
		},
		"Other stage": {},
	},
	pubs: [
		{
			id: whatIsUpWorldPubId,
			pubType: "Basic",
			values: {
				Title: "what is up world",
			},
			// make them related pubs so we can test restrictions on related pubs
			relatedPubs: {
				Relation: pubsStagePubTypeCombinations.map((pub) => ({
					value: null,
					pub,
				})),
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
	apiTokens: {
		allToken: {
			id: allToken,
			permissions: true,
		},
		onlyTestPubType1Token: {
			id: onlyTestPubType1Token,
			permissions: {
				pub: {
					read: {
						pubTypes: [testPubTypeId],
						stages: testStageIds,
					},
				},
			},
		},
		onlyStageToken: {
			id: onlyStageToken,
			permissions: {
				pub: {
					read: {
						pubTypes: allPubTypeIds,
						stages: [testStage1Id],
					},
				},
			},
		},

		testPubType1AndBasicPubTypeToken: {
			id: testPubType1AndBasicPubTypeToken,
			permissions: {
				pub: {
					read: {
						pubTypes: [testPubTypeId, basicPubTypeId],
						stages: testStageIds,
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
						pubTypes: allPubTypeIds,
						stages: ["no-stage"],
					},
				},
			},
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;

const createClient = (token: string, jsonQuery = true) =>
	initClient(siteApi, {
		baseUrl: `http://localhost:3000/`,
		baseHeaders: {
			Authorization: `Bearer ${token}`,
		},
		jsonQuery,
	});

let totalPubs = 0;

test.beforeAll(async ({ browser }) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

	community = await seedCommunity(seed);

	// boo not good
	// FIXME: REWRITE THESE TESTS TO BE LESS DEPENDENT ON ORDER OF EXECUTION
	totalPubs =
		community.pubs.length +
		(community.pubs
			.find((pub) => pub.id === whatIsUpWorldPubId)
			?.values?.filter((val) => val.relatedPubId !== null)?.length ?? 0);

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
	let newPubId: PubsId;
	let firstCreatedAt: Date;

	test.describe("pubs", () => {
		test("should be able to create a pub", async () => {
			const pubTypesResponse = await client.pubTypes.getMany({
				params: {
					communitySlug: COMMUNITY_SLUG,
				},
				query: {},
			});

			expectStatus(pubTypesResponse, 200);
			expect(pubTypesResponse.body).toHaveLength(4);

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

			totalPubs++;

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
					stageId: community.stages["Other stage"].id,
					pubTypeId: pubType.id,
					values: {
						[`${COMMUNITY_SLUG}:title`]: "Goodbye world",
					},
				},
			});

			totalPubs++;

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

			totalPubs--;
		});

		test.describe("filters", () => {
			test("should be able to filter pubs", async () => {
				const response = await client.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {
						filters: {
							[`${COMMUNITY_SLUG}:title`]: {
								$containsi: "what",
							},
						},
					},
				});

				expectStatus(response, 200);
				expect(response.body).toHaveLength(1);
				expect(response.body[0].id).toBe(community.pubs[0].id);

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
				// FIXME: too depdendent on order of execution
				expect(response.body).toHaveLength(1);
				expect(response.body[0].id).not.toBe(newPubId);
			});

			test("should be able to filter by without jsonQuery", async () => {
				const client = createClient(allToken, false);
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
				// FIXME: too depdendent on order of execution
				expect(response.body).toHaveLength(1);
				expect(response.body[0].id).not.toBe(newPubId);
			});

			test("should be able to filter by updatedAt", async () => {
				const updatedAtDate = new Date();
				await sleep(200);
				const updatedPub = await client.pubs.update({
					params: {
						pubId: community.pubs[0].id,
						communitySlug: COMMUNITY_SLUG,
					},
					body: {
						[`${COMMUNITY_SLUG}:title`]: "Updated title",
					},
				});

				expectStatus(updatedPub, 200);

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
				// FIXME: too depdendent on order of execution
				expect(response.body).toHaveLength(1);
				expect(response.body[0].id).toBe(community.pubs[0].id);
				const titleValue = response.body[0].values?.find(
					(val) => val.fieldSlug === `${COMMUNITY_SLUG}:title`
				);
				expect(titleValue).toMatchObject({
					fieldSlug: `${COMMUNITY_SLUG}:title`,
					value: "Updated title",
				});
			});

			/**
			 * this is to test that ?filters[x][y]=z works
			 */
			test("should be able to filter by manually supplying query params", async () => {
				const response = await fetch(
					`http://localhost:3000/api/v0/c/${COMMUNITY_SLUG}/site/pubs?filters[createdAt][$gte]=${firstCreatedAt.toISOString()}`,
					{
						headers: {
							Authorization: `Bearer ${allToken}`,
						},
					}
				);

				const responseBody = await response.json();

				expect(response.status).toBe(200);
				// FIXME: too depdendent on order of execution
				expect(responseBody).toHaveLength(1);
				expect(responseBody[0].id).not.toBe(newPubId);
			});
		});

		test.describe("restrictions", () => {
			test("if only pub type is restricted, only pubs of that pub type are returned", async () => {
				const clientOnlyPubTypeClient = createClient(onlyTestPubType1Token!);

				const pubResponseRestricted = await clientOnlyPubTypeClient.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {},
				});

				expectStatus(pubResponseRestricted, 200);
				expect(pubResponseRestricted.body).toHaveLength(3);
				expect(
					pubResponseRestricted.body.every((pub) => pub.pubTypeId === testPubTypeId)
				).toBe(true);
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
				expect(
					pubResponseRestricted.body.every((pub) => pub.stageId === testStage1Id)
				).toBe(true);
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

			test("if pub types are restricted, we can still further filter by stage", async () => {
				const clientOnlyPubTypeClient = createClient(onlyTestPubType1Token!);

				const pubResponseRestricted = await clientOnlyPubTypeClient.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {
						stageId: testStage1Id,
					},
				});

				expectStatus(pubResponseRestricted, 200);
				expect(pubResponseRestricted.body).toHaveLength(1);
				expect(pubResponseRestricted.body[0].stageId).toBe(testStage1Id);
				expect(pubResponseRestricted.body[0].pubTypeId).toBe(testPubTypeId);
			});

			test("if stages are restricted to pubs not in a stage", async () => {
				const clientNoStageClient = createClient(noStageToken);

				const pubResponseRestricted = await clientNoStageClient.pubs.getMany({
					params: {
						communitySlug: COMMUNITY_SLUG,
					},
					query: {},
				});

				expectStatus(pubResponseRestricted, 200);
				// 2 related, 1 toplevel
				expect(pubResponseRestricted.body).toHaveLength(3);
				expect(pubResponseRestricted.body[0].stageId).toBe(null);
			});

			test.describe("restrictions on related pubs", () => {
				test("if pub types are unrestricted, related pubs are unrestricted", async () => {
					const clientAllClient = createClient(allToken);

					const pubResponseRestricted = await clientAllClient.pubs.getMany({
						params: {
							communitySlug: COMMUNITY_SLUG,
						},
						query: {
							pubIds: [whatIsUpWorldPubId],
						},
					});

					expectStatus(pubResponseRestricted, 200);
					expect(pubResponseRestricted.body).toHaveLength(1);
					expect(pubResponseRestricted.body[0].id).toBe(whatIsUpWorldPubId);
					expect(
						pubResponseRestricted.body[0].values?.filter(
							(val) => val.relatedPubId !== null
						)
					).toHaveLength(6);
				});

				test("if pub types are restricted, related pubs are restricted to the allowed pub types", async () => {
					const clientOnlyPubTypeClient = createClient(testPubType1AndBasicPubTypeToken);

					const pubResponseRestricted = await clientOnlyPubTypeClient.pubs.getMany({
						params: {
							communitySlug: COMMUNITY_SLUG,
						},
						query: {
							pubIds: [whatIsUpWorldPubId],
							withRelatedPubs: true,
						},
					});

					expectStatus(pubResponseRestricted, 200);
					expect(pubResponseRestricted.body).toHaveLength(1);
					expect(pubResponseRestricted.body[0].stageId).toBe(null);

					const relatedPubs = pubResponseRestricted.body[0].values
						?.filter((val) => val.relatedPubId !== null)
						.map((val) => val.relatedPub!);
					expect(relatedPubs!.every((pub) => pub.pubTypeId === testPubTypeId)).toBe(true);
					expect(relatedPubs).toHaveLength(3);
				});

				test("if stages are restricted, related pubs are restricted to the allowed stages", async () => {
					const clientOnlyStageClient = createClient(noStageToken);

					const pubResponseRestricted = await clientOnlyStageClient.pubs.getMany({
						params: {
							communitySlug: COMMUNITY_SLUG,
						},
						query: {
							pubIds: [whatIsUpWorldPubId],
							withRelatedPubs: true,
							withStage: true,
						},
					});

					expectStatus(pubResponseRestricted, 200);
					expect(pubResponseRestricted.body).toHaveLength(1);
					expect(pubResponseRestricted.body[0].stageId).toBe(null);

					const relatedPubs = pubResponseRestricted.body[0].values
						?.filter((val) => val.relatedPubId !== null)
						.map((val) => val.relatedPub!);

					expect(relatedPubs).toHaveLength(2);
					expect(relatedPubs!.every((pub) => pub.stageId === null)).toBe(true);
				});
			});
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
			expect(pubTypes).toHaveLength(4);
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
			// 7 from seed, 2 created in other tests above
			expect(response2.body).toHaveLength(totalPubs);
		});
	});
});
