import { describe, expect, expectTypeOf, it } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import type { UnprocessedPub } from "./pub";
import { mockServerCode } from "~/lib/__tests__/utils";
import { seedCommunity } from "~/prisma/seed/seedCommunity";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const { community, pubFields, pubTypes, stages, pubs } = await seedCommunity({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
		},
		"Minimal Pub": {
			Title: { isTitle: true },
		},
	},
	stages: {
		"Stage 1": {},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
			stage: "Stage 1",
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
			},
			relatedPubs: {
				"Some relation": [
					{
						value: "test relation value",
						pub: {
							pubType: "Basic Pub",
							values: {
								Title: "A pub related to another Pub",
							},
						},
					},
				],
			},
		},
		{
			stage: "Stage 1",
			pubType: "Minimal Pub",
			values: {
				Title: "Minimal pub",
			},
		},
	],
	users: {},
});

describe("createPubRecursive", () => {
	it("should be able to create a simple pub", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
			},
		});

		expect(pub).toMatchObject({
			values: [
				{
					value: "test title",
				},
			],
		});
	});

	it("should be able to create a pub with children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
				children: [
					{
						pubTypeId: pubTypes["Basic Pub"].id,
						values: {
							[pubFields.Title.slug]: "test child title",
						},
					},
				],
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [{ value: "test title" }],
			children: [{ values: [{ value: "test child title" }] }],
		});
	});

	it("should be able to create a pub in a stage", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
				stageId: stages["Stage 1"].id,
			},
			trx,
		});

		expect(pub).toMatchObject({
			stageId: stages["Stage 1"].id,
			values: [{ value: "test title" }],
		});
	});

	it("should be able to create a relation pub value with direct linking", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							relatedPubId: pubs[0].id,
						},
					],
				},
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [
				{ value: "test title" },
				{ value: "test relation value", relatedPubId: pubs[0].id },
			],
		});
	});

	it("should be able to create relation pubs inline, like children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "test relation title",
								},
							},
						},
					],
				},
			},
			trx,
		});

		expect(pub).toMatchObject({
			values: [
				{ value: "test title" },
				{
					value: "test relation value",
					relatedPub: { values: [{ value: "test relation title" }] },
				},
			],
		});
	});

	it("should be able to create a pub with multiple relations in one go", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Main pub",
					[pubFields["Some relation"].slug]: [
						{
							value: "relation 1",
							relatedPubId: pubs[0].id,
						},
						{
							value: "relation 2",
							relatedPubId: pubs[1].id,
						},
					],
				},
			},
		});

		expect(pub).toMatchObject({
			values: [
				{ value: "Main pub" },
				{ value: "relation 1", relatedPubId: pubs[0].id },
				{ value: "relation 2", relatedPubId: pubs[1].id },
			],
		});
	});
});

describe("updatePub", () => {
	it("should be able to update pub values", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew, updatePub } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Original title",
				},
			},
		});

		await updatePub({
			pubId: pub.id,
			pubValues: {
				[pubFields.Title.slug]: "Updated title",
			},
			communityId: community.id,
			continueOnValidationError: false,
		});

		const updatedPub = await trx
			.selectFrom("pub_values")
			.select(["value"])
			.where("pubId", "=", pub.id)
			.execute();

		expect(updatedPub[0].value as string).toBe("Updated title");
	});

	it("should error if trying to update relationship values with updatePub", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew, updatePub } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
			trx,
		});

		await expect(
			updatePub({
				pubId: pub.id,
				pubValues: {
					[pubFields["Some relation"].slug]: "test relation value",
				},
				communityId: community.id,
				continueOnValidationError: false,
			})
		).rejects.toThrow(
			/Pub values contain fields that do not exist in the community: .*?:some-relation/
		);
	});
});

describe("getPubsWithRelatedValuesAndChildren", () => {
	it("should be able to recursively fetch pubvalues", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Some title",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "test relation title",
								},
							},
						},
					],
				},
			},
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const rootPubId = pub.id;
		const pubValues = await getPubsWithRelatedValuesAndChildren(
			{ pubId: rootPubId, communityId: community.id },
			{ depth: 10 }
		);

		expect(pubValues).toMatchObject({
			values: [
				{ value: "Some title" },
				{
					value: "test relation value",
					relatedPub: {
						values: [{ value: "test relation title" }],
					},
				},
			],
		});

		// check that children are defined because `withChildren` is not `false`
		expectTypeOf(pubValues.children).not.toEqualTypeOf<undefined>();
		// check that relatedPub is defined because `withRelatedPubs` is not `false`
		expectTypeOf(pubValues.values[0].relatedPub).not.toEqualTypeOf<undefined>();
	});

	it("should be able to fetch pubvalues with children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Some title",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "Nested Related Pub",
								},
								children: [
									{
										pubTypeId: pubTypes["Basic Pub"].id,
										values: {
											[pubFields.Title.slug]:
												"Nested Child of Nested Related Pub",
										},
									},
								],
							},
						},
					],
				},
				children: [
					{
						pubTypeId: pubTypes["Basic Pub"].id,
						values: {
							[pubFields.Title.slug]: "Child of Root Pub",
						},
						relatedPubs: {
							[pubFields["Some relation"].slug]: [
								{
									value: "Nested Relation",
									pub: {
										pubTypeId: pubTypes["Basic Pub"].id,
										values: {
											[pubFields.Title.slug]:
												"Nested Related Pub of Child of Root Pub",
										},
										relatedPubs: {
											[pubFields["Some relation"].slug]: [
												{
													value: "Double nested relation",
													pub: {
														pubTypeId: pubTypes["Basic Pub"].id,
														values: {
															[pubFields.Title.slug]:
																"Double nested relation title",
														},
													},
												},
											],
										},
									},
								},
								{
									value: "Nested Relation 2",
									pub: {
										pubTypeId: pubTypes["Basic Pub"].id,
										values: {
											[pubFields.Title.slug]:
												"Nested Related Pub of Child of Root Pub 2",
										},
									},
								},
							],
						},
						children: [
							{
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "Grandchild of Root Pub",
								},
							},
						],
					},
				],
			},
			trx,
		});

		const rootPubId = pub.id;
		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubWithRelatedValuesAndChildren = await getPubsWithRelatedValuesAndChildren(
			{ pubId: rootPubId, communityId: community.id },
			{ depth: 10, withPubType: true }
		);

		expectTypeOf(pubWithRelatedValuesAndChildren.pubType).toEqualTypeOf<PubTypes>();

		expect(pubWithRelatedValuesAndChildren).toMatchObject({
			values: [
				{ value: "Some title" },
				{
					value: "test relation value",
					relatedPub: {
						values: [{ value: "Nested Related Pub" }],
						children: [{ values: [{ value: "Nested Child of Nested Related Pub" }] }],
					},
				},
			],
			children: [
				{
					values: [
						{ value: "Child of Root Pub" },
						{
							value: "Nested Relation",
							relatedPub: {
								values: [
									{
										value: "Nested Related Pub of Child of Root Pub",
									},
									{
										value: "Double nested relation",
										relatedPub: {
											values: [{ value: "Double nested relation title" }],
										},
									},
								],
							},
						},
						{
							value: "Nested Relation 2",
						},
					],
					children: [{ values: [{ value: "Grandchild of Root Pub" }] }],
				},
			],
		});
	});

	it("should be able to filter by pubtype or stage and pubtype and stage", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const allPubs = await getPubsWithRelatedValuesAndChildren(
			{ communityId: community.id },
			{ depth: 10 }
		);

		expect(allPubs.length).toBe(5);

		const [minimalPubs, pubsInStage1, basicPubsInStage1] = await Promise.all([
			getPubsWithRelatedValuesAndChildren(
				{ pubTypeId: pubTypes["Minimal Pub"].id, communityId: community.id },
				{ withPubType: true, depth: 10 }
			),
			getPubsWithRelatedValuesAndChildren(
				{ stageId: stages["Stage 1"].id, communityId: community.id },
				{ withStage: true, depth: 10 }
			),
			getPubsWithRelatedValuesAndChildren(
				{
					pubTypeId: pubTypes["Basic Pub"].id,
					stageId: stages["Stage 1"].id,
					communityId: community.id,
				},
				{ withPubType: true, withStage: true, depth: 10 }
			),
		]);

		expect(minimalPubs.length).toBe(1);
		expect(minimalPubs[0].pubType?.id).toBe(pubTypes["Minimal Pub"].id);

		expect(pubsInStage1.length).toBe(2);

		expect(basicPubsInStage1.length).toBe(1);
		expect(basicPubsInStage1[0].pubType?.id).toBe(pubTypes["Basic Pub"].id);
		expect(basicPubsInStage1[0].stage?.id).toBe(stages["Stage 1"].id);
	});

	it("should be able to limit the amount of top-level pubs retrieved while still fetching children and related pubs", async () => {
		const trx = getTrx();

		const newCommunity = await seedCommunity({
			community: {
				name: "test community 2",
				slug: "test-community-2",
			},
			pubFields: {
				Title: {
					schemaName: CoreSchemaType.String,
				},
				Relation: {
					schemaName: CoreSchemaType.String,
					relation: true,
				},
			},
			pubTypes: {
				Article: {
					Title: { isTitle: true },
					Relation: { isTitle: false },
				},
			},
			pubs: [
				{
					pubType: "Article",
					values: {
						Title: "Article Title",
					},
					relatedPubs: {
						Relation: [
							{
								value: "Article Relation",
								pub: {
									pubType: "Article",
									values: {
										Title: "Related Article Title",
									},
								},
							},
						],
					},
					children: [
						{
							pubType: "Article",
							values: {
								Title: "Article Child Title",
							},
						},
					],
				},
			],
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubs = await getPubsWithRelatedValuesAndChildren(
			{ communityId: newCommunity.community.id },
			{
				depth: 10,
				limit: 3,
				_debugDontNest: true,
				orderBy: "createdAt",
				orderDirection: "desc",
			}
		);

		// 3 root pubs, one of which has 1 child pub & 1 related pub, even though the limit is 3. This is correct behavior.
		expect(pubs.length).toBe(5);
	});

	it("should be able to detect cycles, i.e. not go max-depth deep if a loop is detected", async () => {
		const trx = getTrx();

		const newPubId = crypto.randomUUID() as PubsId;

		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				id: newPubId,
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields["Some relation"].slug]: [
										{
											value: "Zoinks scoop I think we're rrrrrecurssinggg",
											relatedPubId: newPubId,
										},
									],
								},
							},
						},
					],
				},
			},
			trx,
		});
		expect(pub).toBeDefined();

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const [withCycleIncluded, withCycleExcluded] = (await Promise.all([
			getPubsWithRelatedValuesAndChildren(
				{ pubId: newPubId, communityId: community.id },
				{ depth: 10, _debugDontNest: true }
			),
			getPubsWithRelatedValuesAndChildren(
				{ pubId: newPubId, communityId: community.id },
				{ depth: 10, cycle: "exclude", _debugDontNest: true }
			),
		])) as unknown as [UnprocessedPub[], UnprocessedPub[]];

		expect(withCycleIncluded.length).toBe(3);

		expect(withCycleIncluded.find((p) => p.isCycle)).toBeDefined();

		expect(withCycleExcluded.length).toBe(2);

		expect(withCycleExcluded.find((p) => p.isCycle)).toBeUndefined();
	});

	it("should be able to only fetch fields for certain slugs", async () => {
		const trx = getTrx();

		const newPubId = crypto.randomUUID() as PubsId;

		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				id: newPubId,
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
					[pubFields.Description.slug]: "test description",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "test relation title",
								},
							},
						},
					],
				},
			},
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubWithRelatedValuesAndChildren = (await getPubsWithRelatedValuesAndChildren(
			{ pubId: newPubId, communityId: community.id },
			{ depth: 10, fieldSlugs: [pubFields.Title.slug, pubFields["Some relation"].slug] }
		)) as unknown as UnprocessedPub[];

		expect(pubWithRelatedValuesAndChildren).toMatchObject({
			values: [
				{ value: "test title" },
				{
					value: "test relation value",
					relatedPub: {
						values: [
							{
								value: "test relation title",
							},
						],
					},
				},
			],
		});
	});

	it("is able to exclude children and related pubs from being fetched", async () => {
		const trx = getTrx();

		const { createPubRecursiveNew } = await import("./pub");
		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
				children: [
					{
						pubTypeId: pubTypes["Basic Pub"].id,
						values: { [pubFields.Title.slug]: "test child title" },
					},
				],
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "related pub title",
								},
							},
						},
					],
				},
			},
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubWithRelatedValuesAndChildren = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10, withChildren: false, withRelatedPubs: false }
		);

		expectTypeOf(pubWithRelatedValuesAndChildren.children).toEqualTypeOf<undefined>();

		expect(pubWithRelatedValuesAndChildren.children).toEqual(undefined);
		expect(pubWithRelatedValuesAndChildren).toMatchObject({
			values: [
				{ value: "test title" },
				{
					value: "test relation value",
				},
			],
		});

		expect(pubWithRelatedValuesAndChildren.values[1].relatedPub).toBeUndefined();
		// check that the relatedPub is `undefined` in type as well as value due to `{withRelatedPubs: false}`
		expectTypeOf(pubWithRelatedValuesAndChildren.values[1]).toMatchTypeOf<{
			relatedPub?: undefined;
		}>();
	});

	it("should be able to retrieve the stage a pub is in", async () => {
		const trx = getTrx();

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pubs[0].id, communityId: community.id },
			{ withStage: true }
		);

		expectTypeOf(pub).toMatchTypeOf<{ stage?: Stages }>();

		expect(pub.stage?.name).toBe("Stage 1");
	});

	it("should be able to fetch members", async () => {
		const trx = getTrx();
		const pubId = pubs[0].id as PubsId;

		// Add a user and make it a member of this pub
		const users = [
			{
				email: "test@email.com",
				slug: "test-user",
				firstName: "test",
				lastName: "user",
			},
			{
				email: "test2@email.com",
				slug: "test-user-2",
				firstName: "test2",
				lastName: "user2",
			},
		];
		const userIds = await trx.insertInto("users").values(users).returning(["id"]).execute();
		await trx
			.insertInto("pub_memberships")
			.values(userIds.map(({ id }) => ({ userId: id, pubId, role: MemberRole.admin })))
			.execute();

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pub = await getPubsWithRelatedValuesAndChildren({ pubId }, { withMembers: true });

		expect(pub).toMatchObject({
			members: users,
		});
	});
});

describe("upsertPubRelations", () => {
	it("should be able to add relations to existing pubs", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		await addPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					value: "test relation value",
					relatedPubId: pubs[0].id,
				},
			],
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub).toMatchObject({
			values: [
				{ value: "test title" },
				{
					value: "test relation value",
					relatedPub: { values: [{ value: "Some title" }] },
				},
			],
		});
	});

	it("should be able to create new pubs as relations", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		await addPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					value: "test relation value",
					relatedPub: {
						pubTypeId: pubTypes["Basic Pub"].id,
						values: {
							[pubFields.Title.slug]: "new related pub",
						},
					},
				},
			],
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub).toMatchObject({
			values: [
				{ value: "test title" },
				{
					value: "test relation value",
					relatedPub: { values: [{ value: "new related pub" }] },
				},
			],
		});
	});

	it("should validate relation values against schema", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		// Should throw error for invalid value type
		await expect(
			addPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: [
					{
						slug: pubFields["Some relation"].slug,
						value: 123, // Number instead of string
						relatedPubId: pubs[0].id,
					},
				],
				trx,
			})
		).rejects.toThrow(pubFields["Some relation"].slug);
	});

	it("should throw error for fields that do not exist in the community", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		await expect(
			addPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: [
					{
						slug: "non-existent-field",
						value: "test value",
						relatedPubId: pubs[0].id,
					},
				],
				trx,
			})
		).rejects.toThrow(
			`Pub values contain fields that do not exist in the community: non-existent-field`
		);
	});

	it("should throw error for non-existent related pub id", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		const nonExistentPubId = crypto.randomUUID() as PubsId;

		await expect(
			addPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: [
					{
						slug: pubFields["Some relation"].slug,
						value: "test value",
						relatedPubId: nonExistentPubId,
					},
				],
				trx,
			})
		).rejects.toThrow();
	});

	it("should be able to add multiple relations at once", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		await addPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					value: "relation 1",
					relatedPubId: pubs[0].id,
				},
				{
					slug: pubFields["Some relation"].slug,
					value: "relation 2",
					relatedPub: {
						pubTypeId: pubTypes["Basic Pub"].id,
						values: {
							[pubFields.Title.slug]: "new related pub",
						},
					},
				},
			],
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub.values).toHaveLength(3); // title + 2 relations
		expect(updatedPub.values.filter((v) => v.relatedPub)).toHaveLength(2);
	});

	it("should be able to upsert relations - overwriting existing and creating new ones", async () => {
		const trx = getTrx();
		const { upsertPubRelations: addPubRelations, createPubRecursiveNew } = await import(
			"./pub"
		);

		// Create initial pub with a relation
		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
		});

		// Add initial relation
		await addPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					value: "original value",
					relatedPubId: pubs[0].id,
				},
			],
			trx,
		});

		// Upsert relations - overwrite existing and add new
		await addPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					// Overwrite existing relation
					slug: pubFields["Some relation"].slug,
					value: "updated value",
					relatedPubId: pubs[0].id,
				},
				{
					// Add new relation
					slug: pubFields["Some relation"].slug,
					value: "new relation",
					relatedPub: {
						pubTypeId: pubTypes["Basic Pub"].id,
						values: {
							[pubFields.Title.slug]: "new related pub",
						},
					},
				},
			],
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub.values).toHaveLength(3); // title + 2 relations

		const relationValues = updatedPub.values.filter((v) => v.relatedPub).map((v) => v.value);
		expect(relationValues).toContain("updated value");
		expect(relationValues).toContain("new relation");

		// Verify the first relation was updated
		const updatedRelation = updatedPub.values.find((v) => v.relatedPub?.id === pubs[0].id);
		expect(updatedRelation?.value).toBe("updated value");
	});
});

describe("removePubRelations", () => {
	it("should remove pub relations", async () => {
		const trx = getTrx();

		const { createPubRecursiveNew } = await import("./pub");

		const pubs = await Promise.all([
			createPubRecursiveNew({
				communityId: community.id,
				body: {
					pubTypeId: pubTypes["Basic Pub"].id,
					values: {
						[pubFields.Title.slug]: "Related pub 1",
					},
				},
			}),
			createPubRecursiveNew({
				communityId: community.id,
				body: {
					pubTypeId: pubTypes["Basic Pub"].id,
					values: {
						[pubFields.Title.slug]: "Related pub 2",
					},
				},
			}),
		]);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Main pub",
					[pubFields["Some relation"].slug]: [
						{
							value: "relation 1",
							relatedPubId: pubs[0].id,
						},
						{
							value: "relation 2",
							relatedPubId: pubs[1].id,
						},
					],
				},
			},
		});

		const { removePubRelations, getPubsWithRelatedValuesAndChildren } = await import("./pub");

		// check that the pub has 2 relations
		const pubWithRelations = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(pubWithRelations.values.filter((v) => v.relatedPub)).toHaveLength(2);

		// Remove one of the relations
		const removedRelatedPubIds = await removePubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					relatedPubId: pubs[0].id,
				},
			],
			trx,
		});

		expect(removedRelatedPubIds).toEqual([pubs[0].id]);

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		// Should still have title + 1 remaining relation
		expect(updatedPub.values).toHaveLength(2);

		// First relation should be removed
		const remainingRelation = updatedPub.values.find((v) => v.relatedPub);
		expect(remainingRelation?.relatedPub?.id).toBe(pubs[1].id);
		expect(remainingRelation?.value).toBe("relation 2");
	});

	it("should remove all relations for a given field slug", async () => {
		const trx = getTrx();

		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields["Title"].slug]: "Test pub",
					[pubFields["Some relation"].slug]: [
						{
							value: "relation 1",
							relatedPubId: pubs[0].id,
						},
						{
							value: "relation 2",
							relatedPubId: pubs[1].id,
						},
					],
				},
			},
		});

		const { removeAllPubRelationsBySlugs, getPubsWithRelatedValuesAndChildren } = await import(
			"./pub"
		);

		// Verify initial state has 2 relations
		const pubWithRelations = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);
		expect(pubWithRelations.values.filter((v) => v.relatedPub)).toHaveLength(2);

		// Remove all relations for the field
		const removedRelatedPubIds = await removeAllPubRelationsBySlugs({
			pubId: pub.id,
			slugs: [pubFields["Some relation"].slug],
			communityId: community.id,
		});

		expect(removedRelatedPubIds.sort()).toEqual([pubs[0].id, pubs[1].id].sort());

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		// Should only have title value left
		expect(updatedPub.values).toHaveLength(1);
		expect(updatedPub.values.find((v) => v.relatedPub)).toBeUndefined();
	});

	it("should throw error when field slug does not exist", async () => {
		const trx = getTrx();

		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		const { removeAllPubRelationsBySlugs } = await import("./pub");

		await expect(
			removeAllPubRelationsBySlugs({
				pubId: pub.id,
				slugs: ["non-existent-field"],
				communityId: community.id,
			})
		).rejects.toThrow(
			"Pub values contain fields that do not exist in the community: non-existent-field"
		);
	});
});

describe("replacePubRelationsBySlug", () => {
	it("should replace all relations for given field slugs with new relations", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		// Create initial pub with relations
		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "Related pub 1",
								},
							},
							value: "relation value 1",
						},
						{
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "Related pub 2",
								},
							},
							value: "relation value 2",
						},
					],
				},
			},
		});

		// Create new pubs to relate
		const newRelatedPub1 = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "New related pub 1",
				},
				relatedPubs: {
					[pubFields["Some relation"].slug]: [
						{
							value: "new relation value 1",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "New related pub 1",
								},
							},
						},
					],
				},
			},
		});

		const newRelatedPub2 = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "New related pub 2",
				},
			},
		});

		const { replacePubRelationsBySlug, getPubsWithRelatedValuesAndChildren } = await import(
			"./pub"
		);

		// Replace relations
		await replacePubRelationsBySlug({
			pubId: pub.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					relatedPubId: newRelatedPub1.id,
					value: "new relation value 1",
				},
				{
					slug: pubFields["Some relation"].slug,
					relatedPubId: newRelatedPub2.id,
					value: "new relation value 2",
				},
			],
			communityId: community.id,
		});

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		const relationValues = updatedPub.values.filter((v) => v.relatedPub);

		expect(relationValues).toHaveLength(2);
		expect(relationValues.map((v) => v.relatedPub?.id).sort()).toEqual(
			[newRelatedPub1.id, newRelatedPub2.id].sort()
		);
		expect(relationValues.map((v) => v.value).sort()).toEqual(
			["new relation value 1", "new relation value 2"].sort()
		);
	});

	it("should handle empty relations object", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		const { replacePubRelationsBySlug, getPubsWithRelatedValuesAndChildren } = await import(
			"./pub"
		);

		await replacePubRelationsBySlug({
			pubId: pub.id,
			relations: [],
			communityId: community.id,
		});

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub.values.filter((v) => v.relatedPub)).toHaveLength(0);
	});

	it("should throw error when field slug does not exist", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		const { replacePubRelationsBySlug } = await import("./pub");

		await expect(
			replacePubRelationsBySlug({
				pubId: pub.id,
				relations: [
					{
						slug: "non-existent-field",
						relatedPubId: "some-id" as PubsId,
						value: "some value",
					},
				],
				communityId: community.id,
			})
		).rejects.toThrow(
			"Pub values contain fields that do not exist in the community: non-existent-field"
		);
	});
});
