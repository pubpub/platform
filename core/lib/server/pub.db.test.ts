import { describe, expect, expectTypeOf, it } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType } from "db/public";

import type { ProcessedPub, UnprocessedPub } from "./pub";
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
			values: [{ value: "test title" }],
			relatedPubs: [
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
			{ pubId: rootPubId },
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
			{ pubId: rootPubId },
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
							value: "Nested Relation 2",
						},
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
					],
					children: [{ values: [{ value: "Grandchild of Root Pub" }] }],
				},
			],
		});
	});

	it("should be able to fetch all the pubs of a specific pubtype", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

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

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pubWithRelatedValuesAndChildren = await getPubsWithRelatedValuesAndChildren(
			{ communityId: community.id },
			{ depth: 10 }
		);

		expect(pubWithRelatedValuesAndChildren.length).toBe(5);

		const submissionPubs = await getPubsWithRelatedValuesAndChildren(
			{ pubTypeId: pubTypes["Basic Pub"].id },
			{ withPubType: true, depth: 10 }
		);

		expect(submissionPubs[0].pubType?.id).toBe(pubTypes["Basic Pub"].id);
	});

	it("should be able to limit the amount of top-level pubs retrieved", async () => {
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
				limit: 1,
				_debugDontNest: true,
			}
		);

		// 1 root pub, 1 child pub, 1 related pub, even though the limit is 1. This is correct behavior.
		expect(pubs.length).toBe(3);
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
				{ pubId: newPubId },
				{ depth: 10, _debugDontNest: true }
			),
			getPubsWithRelatedValuesAndChildren(
				{ pubId: newPubId },
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
			{ pubId: newPubId },
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
			{ pubId: pub.id },
			{ depth: 10, withChildren: false, withRelatedPubs: false }
		);

		expectTypeOf(pubWithRelatedValuesAndChildren.children).toEqualTypeOf<undefined>();

		expect(pubWithRelatedValuesAndChildren.children).toEqual([]);
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
			{ pubId: pubs[0].id },
			{ withStage: true }
		);

		expectTypeOf(pub).toMatchTypeOf<{ stage: Stages }>();

		expect(pub.stage.name).toBe("Stage 1");
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
			{ pubId: pub.id },
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
			{ pubId: pub.id },
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

	it("should throw error for non-existent field slugs", async () => {
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
		).rejects.toThrow(`No pub field found for slug 'non-existent-field'`);
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
			{ pubId: pub.id },
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
			{ pubId: pub.id },
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
