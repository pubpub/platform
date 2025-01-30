import { describe, expect, expectTypeOf, it, vitest } from "vitest";
import { array } from "zod";

import type { ProcessedPub, PubTypePubField } from "contracts";
import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import type { MaybeHas } from "../types";
import type { UnprocessedPub, UpsertPubInput } from "./pub";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createLastModifiedBy } from "../lastModifiedBy";
import { getPlainPub, updatePub } from "./pub";

const { createSeed, seedCommunity } = await import("~/prisma/seed/seedCommunity");

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

// Helper function to create the matcher object
//   const expectPub = (pubOrId: ProcessedPub | PubsId) => {
// 	const matchers = {
// 	  async toExist(this: vitest.MatcherContext) {
// 		if (typeof pubOrId !== 'string') {
// 		  throw new Error('toExist() can only be called with a PubsId');
// 		}

// 		const pub = await getPlainPub(pubOrId).executeTakeFirst();
// 		const pass = Boolean(pub && pub.id === pubOrId);

// 		return {
// 		  pass,
// 		  message: () =>
// 			pass
// 			  ? `Expected pub with ID ${pubOrId} not to exist, but it does`
// 			  : `Expected pub with ID ${pubOrId} to exist, but it does not`,
// 		};
// 	  },

// 	  toHaveValues(this: jest.MatcherContext, expected: Partial<ProcessedPub["values"][number]>[]) {
// 		if (typeof pubOrId === 'string') {
// 		  throw new Error('toHaveValues() can only be called with a ProcessedPub');
// 		}

// 		const pub = pubOrId;
// 		const sortedPubValues = [...pub.values].sort((a, b) =>
// 		  (a.value as string).localeCompare(b.value as string)
// 		);

// 		const pass =
// 		  sortedPubValues.length === expected.length &&
// 		  expected.every(expectedValue =>
// 			sortedPubValues.some(actualValue =>
// 			  Object.entries(expectedValue).every(([key, value]) =>
// 				actualValue[key as keyof typeof actualValue] === value
// 			  )
// 			)
// 		  );

// 		return {
// 		  pass,
// 		  message: () =>
// 			pass
// 			  ? `Expected pub not to have values ${JSON.stringify(expected)}, but it does`
// 			  : `Expected pub to have values ${JSON.stringify(expected)}, but it has ${JSON.stringify(sortedPubValues)}`,
// 		};
// 	  },
// 	};

// 	return {
// 	  ...matchers,
// 	  not: {
// 		...matchers,
// 		toHaveValues: function (expected: Partial<ProcessedPub["values"][number]>[]) {
// 		  const result = matchers.toHaveValues.call(this, expected);
// 		  return { ...result, pass: !result.pass };
// 		},
// 		toExist: async function () {
// 		  const result = await matchers.toExist.call(this);
// 		  return { ...result, pass: !result.pass };
// 		},
// 	  },
// 	};
//   };

// Add the custom matcher
expect.extend({
	async toExist(received: PubsId | ProcessedPub) {
		if (typeof received !== "string") {
			throw new Error("toExist() can only be called with a PubsId");
		}
		const { getPlainPub } = await import("./pub");

		const pub = await getPlainPub(received).executeTakeFirst();
		const pass = Boolean(pub && pub.id === received);
		const { isNot } = this;

		return {
			pass,
			message: () =>
				pass
					? `Expected pub with ID ${received} ${isNot ? "not" : ""} to exist, and it does ${isNot ? "not" : ""}`
					: `Expected pub with ID ${received} ${isNot ? "not to" : "to"} exist, but it does not`,
		};
	},

	toHaveValues(
		received: PubsId | ProcessedPub,
		expected: Partial<ProcessedPub["values"][number]>[]
	) {
		if (typeof received === "string") {
			throw new Error("toHaveValues() can only be called with a ProcessedPub");
		}

		const pub = received;
		const sortedPubValues = [...pub.values].sort((a, b) =>
			(a.value as string).localeCompare(b.value as string)
		);

		const expectedLength = expected.length;
		const receivedLength = sortedPubValues.length;

		const isNot = this.isNot;
		if (!isNot && !this.equals(expectedLength, receivedLength)) {
			return {
				pass: false,
				message: () =>
					`Expected pub to have ${expectedLength} values, but it has ${receivedLength}`,
			};
		}

		const pass = expected.every((expectedValue) =>
			sortedPubValues.some((actualValue) =>
				Object.entries(expectedValue).every(
					([key, value]) => actualValue[key as keyof typeof actualValue] === value
				)
			)
		);

		return {
			pass,
			message: () =>
				pass
					? `Expected pub ${isNot ? "not" : ""} to have values ${JSON.stringify(expected)}, and it does ${isNot ? "not" : ""}`
					: `Expected pub ${isNot ? "not to" : "to"} match values ${this.utils.diff(sortedPubValues, expected)}`,
		};
	},
});

const seed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
		stageEditor: {
			role: MemberRole.contributor,
		},
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
		"Another relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
			"Another relation": { isTitle: false },
		},
		"Minimal Pub": {
			Title: { isTitle: true },
		},
	},
	stages: {
		"Stage 1": {
			members: {
				stageEditor: MemberRole.editor,
			},
		},
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
});

const { community, pubFields, pubTypes, stages, pubs, users } = await seedCommunity(seed);

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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		expect(pub).toMatchObject({
			values: [
				{ value: "Main pub" },
				{ value: "relation 1", relatedPubId: pubs[0].id },
				{ value: "relation 2", relatedPubId: pubs[1].id },
			],
		});
	});

	it("should return the titles of the created pub, the children, and the related pubs", async () => {
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		expect(pub).toMatchObject({
			title: "test title",
			children: [{ title: "test child title" }],
		});
		const relatedPubValue = pub.values.find(
			(v) => v.fieldSlug === pubFields["Some relation"].slug
		);
		expect(relatedPubValue, "No related pub value found").toBeDefined();
		expect(relatedPubValue?.relatedPub?.title).toEqual("test relation title");
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await updatePub({
			pubId: pub.id,
			pubValues: {
				[pubFields.Title.slug]: "Updated title",
			},
			communityId: community.id,
			continueOnValidationError: false,
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await expect(
			updatePub({
				pubId: pub.id,
				pubValues: {
					[pubFields["Some relation"].slug]: "test relation value",
				},
				communityId: community.id,
				continueOnValidationError: false,
				lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const rootPubId = pub.id;
		const pubValues = await getPubsWithRelatedValuesAndChildren(
			{ pubId: rootPubId, communityId: community.id, userId: users.admin.id },
			{ depth: 10 }
		);

		pubValues.values.sort((a, b) => a.fieldSlug.localeCompare(b.fieldSlug));
		expect(pubValues.values).toMatchObject([
			{
				value: "test relation value",
				relatedPub: {
					values: [{ value: "test relation title" }],
				},
			},
			{ value: "Some title" },
		]);

		// check that children are defined because `withChildren` is not `false`
		expectTypeOf(pubValues.children).not.toEqualTypeOf<undefined>();
		// check that relatedPub is defined because `withRelatedPubs` is not `false`
		expectTypeOf(pubValues.values[0].relatedPub).not.toEqualTypeOf<undefined>();
	});

	// to make sure we aren't accidentally returning temporary columns used for the query as the final result
	it("should return all the correct columns", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				stageId: stages["Stage 1"].id,
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Some title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: createdPub.id, communityId: community.id },
			{
				depth: 10,
				withPubType: true,
				withStage: true,
				withMembers: true,
				withLegacyAssignee: true,
			}
		);

		expect(pub).toMatchObject({
			id: createdPub.id,
		});

		expect(pub.pubType).toMatchObject({
			id: pubTypes["Basic Pub"].id,
			fields: Object.values(pubTypes["Basic Pub"].pubFields).map((f) => ({
				id: f.id,
				slug: f.slug,
			})),
		});
		expect(pub.stage).toMatchObject({
			id: stages["Stage 1"].id,
			name: "Stage 1",
			order: stages["Stage 1"].order,
		});
		expect(pub.members).toEqual([]);
		expect(pub.assignee).toEqual(null);
		expect(Object.keys(pub).sort()).toEqual(
			[
				"id",
				"pubType",
				"stage",
				"members",
				"assignee",
				"values",
				"children",
				"stageId",
				"pubTypeId",
				"createdAt",
				"updatedAt",
				"parentId",
				"title",
				"communityId",
				"depth",
				"isCycle",
			].sort()
		);
	});

	it("should be able to fetch pubvalues with children", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew, getPubsWithRelatedValuesAndChildren } = await import(
			"./pub"
		);

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
								// we don't do children anymore
								// children: [
								// 	{
								// 		pubTypeId: pubTypes["Basic Pub"].id,
								// 		values: {
								// 			[pubFields.Title.slug]:
								// 				"Nested Child of Nested Related Pub",
								// 		},
								// 	},
								// ],
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const rootPubId = pub.id;
		const pubWithRelatedValuesAndChildren = await getPubsWithRelatedValuesAndChildren(
			{ pubId: rootPubId, communityId: community.id },
			{ depth: 10, withPubType: true, trx }
		);

		expectTypeOf(pubWithRelatedValuesAndChildren.pubType).toEqualTypeOf<
			PubTypes & { fields: PubTypePubField[] }
		>();

		pubWithRelatedValuesAndChildren.values.sort((a, b) =>
			a.fieldSlug.localeCompare(b.fieldSlug)
		);
		pubWithRelatedValuesAndChildren.children[0].values.sort((a, b) =>
			a.fieldSlug.localeCompare(b.fieldSlug)
		);
		expect(pubWithRelatedValuesAndChildren).toMatchObject({
			values: [
				{
					value: "test relation value",
					relatedPub: {
						values: [{ value: "Nested Related Pub" }],
						// children: [{ values: [{ value: "Nested Child of Nested Related Pub" }] }],
					},
				},
				{ value: "Some title" },
			],
			children: [
				{
					values: [
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
						{ value: "Child of Root Pub" },
					],
					children: [{ values: [{ value: "Grandchild of Root Pub" }] }],
				},
			],
		});
	});

	it("should be able to filter by pubtype or stage and pubtype and stage", async () => {
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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

		expectTypeOf(pub).toMatchTypeOf<{ stage: Stages | null }>();

		expect(pub.stage?.name).toBe("Stage 1");
	});

	it("should be able to fetch members", async () => {
		const trx = getTrx();
		const pubId = pubs[0].id as PubsId;

		// Add a user and make it a member of this pub
		const newUsers = [
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
		const userIds = await trx.insertInto("users").values(newUsers).returning(["id"]).execute();
		await trx
			.insertInto("pub_memberships")
			.values(userIds.map(({ id }) => ({ userId: id, pubId, role: MemberRole.admin })))
			.execute();

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pub = await getPubsWithRelatedValuesAndChildren(
			{ pubId, communityId: community.id, userId: users.admin.id },
			{ withMembers: true }
		);

		expect(pub).toMatchObject({
			members: newUsers.map((u) => ({ ...u, role: MemberRole.admin })),
		});
	});

	it("should fetch a pub that has no pub values", async () => {
		const trx = getTrx();

		const { createPubRecursiveNew } = await import("./pub");

		const emptyPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pub = await getPubsWithRelatedValuesAndChildren(
			{
				pubId: emptyPub.id,
				communityId: community.id,
			},
			{ withChildren: false }
		);

		expect(pub).toMatchObject({
			id: emptyPub.id,
			values: [],
		});
	});

	it("should not fetch values if withValues is false", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
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
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		const pub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: createdPub.id, communityId: community.id },
			{ withValues: false }
		);

		expect(pub.values.length).toBe(0);
		expect(pub.children?.[0].values.length).toBe(0);
	});
});

describe("upsertPubRelations", () => {
	it("should be able to add relations to existing pubs", async () => {
		const trx = getTrx();
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		await upsertPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: {
				merge: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								value: "test relation value",
								pub: { id: pubs[0].id },
							},
						],
					},
				},
			},
			trx,
			lastModifiedBy: createLastModifiedBy("system"),
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
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		await upsertPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: {
				merge: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								value: "test relation value",
								pub: {
									pubTypeId: pubTypes["Basic Pub"].id,
									values: {
										replace: {
											[pubFields.Title.slug]: "new related pub",
										},
									},
								},
							},
						],
					},
				},
			},
			trx,
			lastModifiedBy: createLastModifiedBy("system"),
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
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		// Should throw error for invalid value type
		await expect(
			upsertPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: {
					merge: {
						relations: {
							[pubFields["Some relation"].slug]: [
								{
									value: 123, // Number instead of string
									pub: { id: pubs[0].id },
								},
							],
						},
					},
				},
				trx,
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(pubFields["Some relation"].slug);
	});

	it("should throw error for fields that do not exist in the community", async () => {
		const trx = getTrx();
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			trx,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await expect(
			upsertPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: {
					merge: {
						relations: {
							["non-existent-field"]: [
								{
									value: "test value",
									pub: { id: pubs[0].id },
								},
							],
						},
					},
				},
				trx,
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(
			`Pub values contain fields that do not exist in the community: non-existent-field`
		);
	});

	it("should throw error for non-existent related pub id", async () => {
		const trx = getTrx();
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const nonExistentPubId = crypto.randomUUID() as PubsId;

		await expect(
			upsertPubRelations({
				pubId: pub.id,
				communityId: community.id,
				relations: {
					merge: {
						relations: {
							[pubFields["Some relation"].slug]: [
								{
									value: "test value",
									pub: { id: nonExistentPubId },
								},
							],
						},
					},
				},
				trx,
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow();
	});

	it("should be able to add multiple relations at once", async () => {
		const trx = getTrx();
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		await upsertPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: {
				merge: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								value: "relation 1",
								pub: { id: pubs[0].id },
							},
							{
								value: "relation 2",
								pub: {
									pubTypeId: pubTypes["Basic Pub"].id,
									values: {
										replace: {
											[pubFields.Title.slug]: "new related pub",
										},
									},
								},
							},
						],
					},
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
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
		const { upsertPubRelations, createPubRecursiveNew } = await import("./pub");

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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		// Add initial relation
		await upsertPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: {
				merge: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								value: "original value",
								pub: { id: pubs[0].id },
							},
						],
					},
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		// Upsert relations - overwrite existing and add new
		await upsertPubRelations({
			pubId: pub.id,
			communityId: community.id,
			relations: {
				merge: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								// Overwrite existing relation
								value: "updated value",
								pub: { id: pubs[0].id },
							},
							{
								// Add new relation
								value: "new relation",
								pub: {
									pubTypeId: pubTypes["Basic Pub"].id,
									values: {
										replace: {
											[pubFields.Title.slug]: "new related pub",
										},
									},
								},
							},
						],
					},
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
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
				lastModifiedBy: createLastModifiedBy("system"),
			}),
			createPubRecursiveNew({
				communityId: community.id,
				body: {
					pubTypeId: pubTypes["Basic Pub"].id,
					values: {
						[pubFields.Title.slug]: "Related pub 2",
					},
				},
				lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		expect(removedRelatedPubIds.length).toBe(1);
		expect(removedRelatedPubIds[0].relatedPubId).toEqual(pubs[0].id);

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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { removeAllPubRelationsBySlugs } = await import("./pub");

		await expect(
			removeAllPubRelationsBySlugs({
				pubId: pub.id,
				slugs: ["non-existent-field"],
				communityId: community.id,
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(
			"Pub values contain fields that do not exist in the community: non-existent-field"
		);
	});

	it("should not throw an error when there are no relations to remove", async () => {
		const trx = getTrx();
		const { removeAllPubRelationsBySlugs, createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		expect(pub.values).toHaveLength(0);

		await expect(
			removeAllPubRelationsBySlugs({
				pubId: pub.id,
				communityId: community.id,
				slugs: [pubFields["Some relation"].slug],
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).resolves.toEqual([]);
	});
});

describe("upsertPubRelations: replace", () => {
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const newRelatedPub2 = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "New related pub 2",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { upsertPubRelations, getPubsWithRelatedValuesAndChildren } = await import("./pub");

		// Replace relations
		await upsertPubRelations({
			pubId: pub.id,
			relations: {
				replace: {
					relations: {
						[pubFields["Some relation"].slug]: [
							{
								pub: {
									id: newRelatedPub1.id,
								},
								value: "new relation value 1",
							},
							{
								pub: {
									id: newRelatedPub2.id,
								},
								value: "new relation value 2",
							},
						],
					},
				},
			},
			communityId: community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);
		console.log(updatedPub);

		expect(updatedPub).toHaveValues([
			{ value: "new relation value 1", relatedPubId: newRelatedPub1.id },
			{ value: "new relation value 2", relatedPubId: newRelatedPub2.id },
		]);
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { upsertPubRelations, getPubsWithRelatedValuesAndChildren } = await import("./pub");

		await upsertPubRelations({
			pubId: pub.id,
			relations: {
				replace: { relations: {} },
			},
			communityId: community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const updatedPub = await getPubsWithRelatedValuesAndChildren(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub).toHaveValues([]);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(
			"Pub values contain fields that do not exist in the community: non-existent-field"
		);
	});
});

describe("upsertPub", () => {
	const createCommonUpsert = () => ({
		communityId: community.id,
		pubTypeId: pubTypes["Basic Pub"].id,
		lastModifiedBy: createLastModifiedBy("system"),
	});

	// Common setup helper
	const upsertPubHelper = async (
		options?: MaybeHas<UpsertPubInput, "communityId" | "pubTypeId" | "lastModifiedBy">
	) => {
		const { upsertPub, getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const upsertedPub = await upsertPub({
			...createCommonUpsert(),
			id: options?.id,
			values: {
				replace: {
					[pubFields.Title.slug]: "Basic pub",
				},
			},
			...options,
		});

		const pubWithRelatedValues = await getPubsWithRelatedValuesAndChildren(
			{ pubId: upsertedPub.id, communityId: community.id },
			{ depth: 10 }
		);

		pubWithRelatedValues.values.sort((a, b) =>
			(a.value as string).localeCompare(b.value as string)
		);

		return { upsertPubResult: upsertedPub, pub: pubWithRelatedValues };
	};

	describe("basic pub operations", () => {
		it("creates a pub with a specific id", async () => {
			const specificId = crypto.randomUUID() as PubsId;
			const { pub } = await upsertPubHelper({ id: specificId });
			expect(pub.id).toBe(specificId);
		});

		it("merges values with existing pub while preserving other fields", async () => {
			// Create initial pub with title and description

			const pub1Id = crypto.randomUUID() as PubsId;
			const { pub } = await upsertPubHelper({
				id: pub1Id,
				values: {
					merge: {
						[pubFields.Title.slug]: "Original title",
						[pubFields.Description.slug]: "Original description",
					},
				},
			});

			// Update only the title
			const { pub: updatedPub } = await upsertPubHelper({
				id: pub1Id,
				values: {
					merge: {
						[pubFields.Title.slug]: "Updated title",
					},
				},
			});

			expect(updatedPub).toHaveValues([
				{ value: "Original description", fieldSlug: pubFields.Description.slug },
				{ value: "Updated title", fieldSlug: pubFields.Title.slug },
			]);

			// Verify both fields exist with correct values
		});

		it("replaces values with existing pub if replace is passed", async () => {
			const { pub } = await upsertPubHelper({
				values: {
					replace: {
						[pubFields.Title.slug]: "Basic pub",
						[pubFields.Description.slug]: "Basic description",
					},
				},
			});

			expect(pub).toHaveValues([
				{ value: "Basic description", fieldSlug: pubFields.Description.slug },
				{ value: "Basic pub", fieldSlug: pubFields.Title.slug },
			]);

			const { pub: pub2 } = await upsertPubHelper({
				values: {
					replace: {
						[pubFields.Description.slug]: "Basic pub 2 Description",
					},
				},
			});

			expect(pub2).toHaveValues([
				{ value: "Basic pub 2 Description", fieldSlug: pubFields.Description.slug },
			]);

			// title should have been removed
			expect(pub2.title).toBe(null);
		});
	});

	describe("pub relations", () => {
		describe("basic relation operations", () => {
			it("creates a relation between two existing pubs", async () => {
				const { pub: pub1 } = await upsertPubHelper();

				// Create second pub with relation to first
				const { pub: pub2 } = await upsertPubHelper({
					values: {
						replace: {
							[pubFields.Title.slug]: "Second pub",
						},
					},
					relations: {
						replace: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: { id: pub1.id },
										value: "Related pub note",
									},
								],
							},
						},
					},
				});

				expect(pub2).toHaveValues([
					{ value: "Related pub note", relatedPubId: pub1.id },
					{ value: "Second pub", fieldSlug: pubFields.Title.slug },
				]);
			});
		});

		describe("relations.merge behavior", () => {
			it("updates existing relations when using stable IDs", async () => {
				const pub1Id = crypto.randomUUID() as PubsId;
				const pub2Id = crypto.randomUUID() as PubsId;

				// Initial creation with relation
				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										value: "Related pub note",
										pub: {
											id: pub2Id,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub merge",
												},
											},
										},
									},
								],
							},
						},
					},
				});

				expect(pub1).toHaveValues([
					{ value: "Basic pub", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note", relatedPubId: pub2Id },
				]);

				const { pub: pub1Merged } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub merge" },
					},
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: pub2Id,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub merge",
												},
											},
										},
										value: "Related pub note merge",
									},
								],
							},
						},
					},
				});

				expect(pub1Merged).toHaveValues([
					{ value: "First pub merge", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note merge", relatedPubId: pub2Id },
				]);
			});

			it("creates new relations when merging without stable IDs", async () => {
				// Similar structure but testing merge without IDs for the related pub
				const pub1Id = crypto.randomUUID() as PubsId;

				// we redo the same upsert but with different values,
				// the relations should be added, not updated, because we did not supply stable ids for the related pub
				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub merge" },
					},
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub",
												},
											},
										},
										value: "Related pub note",
									},
								],
							},
						},
					},
				});

				expect(pub1).toHaveValues([
					{ value: "First pub merge", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note" },
				]);

				const newRelatedPubId = crypto.randomUUID() as PubsId;
				const { pub: pub1Merged } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub merge" },
					},
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: newRelatedPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]:
														"Newly created related pub",
												},
											},
										},
										value: "Newly created related pub note",
									},
								],
							},
						},
					},
				});

				expect(pub1Merged).toHaveValues([
					{ value: "First pub merge", fieldSlug: pubFields.Title.slug },
					{ value: "Newly created related pub note", relatedPubId: newRelatedPubId },
					{ value: "Related pub note", relatedPubId: pub1.values[1].relatedPubId },
				]);
			});
		});

		describe("relations.replace behavior", () => {
			it("replaces all relations when using replace mode", async () => {
				const pub1Id = crypto.randomUUID() as PubsId;
				const initialRelationPubId = crypto.randomUUID() as PubsId;

				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub" },
					},
					relations: {
						replace: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: initialRelationPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub",
												},
											},
										},
										value: "Related pub note",
									},
								],
							},
						},
					},
				});

				expect(pub1).toHaveValues([
					{ value: "First pub", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note", relatedPubId: initialRelationPubId },
				]);
				expect(initialRelationPubId).toBeTruthy();

				// we redo the same upsert but with different values,
				// the relations should be added, not updated, because we did not supply stable ids for the related pub
				const { pub: pub1Redo } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub replace" },
					},
					relations: {
						replace: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub replace",
												},
											},
										},
										value: "Related pub note replace",
									},
								],
							},
						},
					},
				});

				expect(pub1Redo).toHaveValues([
					{ value: "First pub replace", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note replace" },
				]);

				await expect(initialRelationPubId).toExist();

				const replacedRelationPubId = pub1Redo.values[1].relatedPub!.id;
				expect(replacedRelationPubId).toBeTruthy();

				await expect(replacedRelationPubId).toExist();
			});

			it("deletes orphaned pubs when deleteOrphans is true", async () => {
				// Test orphan deletion
				const pub1Id = crypto.randomUUID() as PubsId;
				const initialRelationPubId = crypto.randomUUID() as PubsId;

				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub" },
					},
					relations: {
						replace: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: initialRelationPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub",
												},
											},
										},
										value: "Related pub note",
									},
								],
							},
						},
					},
				});

				expect(pub1).toHaveValues([
					{ value: "First pub", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note", relatedPubId: initialRelationPubId },
				]);

				await expect(initialRelationPubId).toExist();

				const { pub: pub1RedoPrune } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub replace prune" },
					},
					relations: {
						replace: {
							deleteOrphans: true,
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]:
														"Related pub replace prune",
												},
											},
										},
										value: "Related pub note replace prune",
									},
								],
							},
						},
					},
				});

				expect(pub1RedoPrune).toHaveValues([
					{ value: "First pub replace prune", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note replace prune" },
				]);

				await expect(initialRelationPubId).not.toExist();
				await expect(pub1RedoPrune.values[1].relatedPubId).toExist();

				await expect(pub1Id).toExist();
			});

			it("updates relations while preserving specified relations", async () => {
				const pub1Id = crypto.randomUUID() as PubsId;
				const initialSomeRelationPub1Id = crypto.randomUUID() as PubsId;
				const initialSomeRelationPub2Id = crypto.randomUUID() as PubsId;
				const initialAnotherRelationPubId = crypto.randomUUID() as PubsId;

				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub" },
					},
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: initialSomeRelationPub1Id,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub 1",
												},
											},
										},
										value: "Related pub note 1",
									},
									{
										pub: {
											id: initialSomeRelationPub2Id,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub 2",
												},
											},
										},
										value: "Related pub note 2",
									},
								],
								[pubFields["Another relation"].slug]: [
									{
										pub: {
											id: initialAnotherRelationPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Another relation pub",
												},
											},
										},
										value: "Another relation pub note",
									},
								],
							},
						},
					},
				});

				expect(pub1).toHaveValues([
					{
						value: "Another relation pub note",
						relatedPubId: initialAnotherRelationPubId,
					},
					{ value: "First pub", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note 1", relatedPubId: initialSomeRelationPub1Id },
					{ value: "Related pub note 2", relatedPubId: initialSomeRelationPub2Id },
				]);
				await expect(initialSomeRelationPub1Id).toExist();
				await expect(initialSomeRelationPub2Id).toExist();
				await expect(initialAnotherRelationPubId).toExist();

				// Update while preserving one relation
				const { pub: pub1Redo } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub replace" },
					},
					relations: {
						replace: {
							deleteOrphans: true,
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: { id: initialSomeRelationPub1Id },
										value: "Related pub note replace",
									},
								],
							},
						},
					},
				});

				expect(pub1Redo).toHaveValues([
					{ value: "First pub replace", fieldSlug: pubFields.Title.slug },
					{ value: "Related pub note replace" },
				]);

				await expect(initialSomeRelationPub1Id).toExist();
				await expect(initialSomeRelationPub2Id).not.toExist();
				await expect(initialAnotherRelationPubId).not.toExist();
			});

			it("removes all relations when given empty relations object", async () => {
				const pub1Id = crypto.randomUUID() as PubsId;
				const initialSomeRelationPubId = crypto.randomUUID() as PubsId;
				const initialAnotherRelationPubId = crypto.randomUUID() as PubsId;

				// Create initial pub with relations
				const { pub: pub1 } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub" },
					},
					relations: {
						merge: {
							relations: {
								[pubFields["Some relation"].slug]: [
									{
										pub: {
											id: initialSomeRelationPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Related pub",
												},
											},
										},
										value: "Related pub note",
									},
								],
								[pubFields["Another relation"].slug]: [
									{
										pub: {
											id: initialAnotherRelationPubId,
											pubTypeId: pubTypes["Basic Pub"].id,
											values: {
												replace: {
													[pubFields.Title.slug]: "Another relation pub",
												},
											},
										},
										value: "Another relation pub note",
									},
								],
							},
						},
					},
				});

				await expect(initialSomeRelationPubId).toExist();
				await expect(initialAnotherRelationPubId).toExist();

				// Remove all relations by passing empty relations object
				const { pub: pub1Final } = await upsertPubHelper({
					id: pub1Id,
					values: {
						replace: { [pubFields.Title.slug]: "First pub replace" },
					},
					relations: {
						replace: {
							deleteOrphans: true,
							relations: {},
						},
					},
				});

				expect(pub1Final).toHaveValues([
					{ value: "First pub replace", fieldSlug: pubFields.Title.slug },
				]);

				await expect(initialSomeRelationPubId).not.toExist();
				await expect(initialAnotherRelationPubId).not.toExist();
			});
		});
	});
});
