import { describe, expect, expectTypeOf, it } from "vitest";

import type { PubTypePubField } from "contracts";
import type { PubsId, PubTypes, Stages } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import type { UnprocessedPub } from "./pub";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/prisma/seed/createSeed";
import { createLastModifiedBy } from "../lastModifiedBy";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

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
		"Stage 1": {
			members: {
				stageEditor: MemberRole.editor,
			},
		},
		"Stage 2": {},
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

describe("createPubRecursive", () => {
	it("should be able to create a simple pub", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes } = await seedCommunity(seed);
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

	it("should be able to create a pub in a stage", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, stages } = await seedCommunity(seed);
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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

	it("should be able to create relation pubs inline", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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

	it("should return the titles of the created pub, and the related pubs", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		expect(pub).toMatchObject({
			title: "test title",
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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

	it("should be able to update multiple relationship values", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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

		await updatePub({
			pubId: pub.id,
			pubValues: {
				[pubFields["Some relation"].slug]: [
					{ value: "new value", relatedPubId: pubs[0].id },
					{ value: "another new value", relatedPubId: pubs[1].id },
				],
			},
			communityId: community.id,
			continueOnValidationError: false,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const updatedPub = await trx
			.selectFrom("pub_values")
			.select(["value", "relatedPubId"])
			.where("pubId", "=", pub.id)
			.execute();

		expect(updatedPub[1].value as string).toBe("new value");
		expect(updatedPub[1].relatedPubId).toBe(pubs[0].id);

		expect(updatedPub[2].value as string).toBe("another new value");
		expect(updatedPub[2].relatedPubId).toBe(pubs[1].id);
	});
});

describe("getPubsWithRelatedValues", () => {
	it("should be able to recursively fetch pubvalues", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, users } = await seedCommunity(seed);
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

		const { getPubsWithRelatedValues } = await import("./pub");
		const rootPubId = pub.id;
		const pubValues = await getPubsWithRelatedValues(
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

		// check that relatedPub is defined because `withRelatedPubs` is not `false`
		expectTypeOf(pubValues.values[0].relatedPub).not.toEqualTypeOf<undefined>();
	});

	// to make sure we aren't accidentally returning temporary columns used for the query as the final result
	it("should return all the correct columns", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, stages } = await seedCommunity(seed);
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

		const { getPubsWithRelatedValues } = await import("./pub");
		const pub = await getPubsWithRelatedValues(
			{ pubId: createdPub.id, communityId: community.id },
			{
				depth: 10,
				withPubType: true,
				withStage: true,
				withMembers: true,
			}
		);

		expect(pub).toMatchObject({
			id: createdPub.id,
		});

		expect(pub.pubType).toMatchObject({
			id: pubTypes["Basic Pub"].id,
			fields: Object.values(pubTypes["Basic Pub"].fields).map((f) => ({
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
		expect(Object.keys(pub).sort()).toEqual(
			[
				"id",
				"pubType",
				"stage",
				"members",
				"values",
				"stageId",
				"pubTypeId",
				"createdAt",
				"updatedAt",
				"title",
				"communityId",
				"depth",
				"isCycle",
			].sort()
		);
	});

	it("should be able to fetch pubvalues", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
							},
						},
					],
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const rootPubId = pub.id;
		const { getPubsWithRelatedValues } = await import("./pub");
		const pubWithRelatedValues = await getPubsWithRelatedValues(
			{ pubId: rootPubId, communityId: community.id },
			{ depth: 10, withPubType: true }
		);

		expectTypeOf(pubWithRelatedValues.pubType).toEqualTypeOf<
			PubTypes & { fields: PubTypePubField[] }
		>();

		pubWithRelatedValues.values.sort((a, b) => a.fieldSlug.localeCompare(b.fieldSlug));
		expect(pubWithRelatedValues).toHaveValues([
			{ value: "Some title" },
			{
				value: "test relation value",
				relatedPub: {
					values: [{ value: "Nested Related Pub" }],
				},
			},
		]);
	});

	it("should be able to filter by pubtype or stage and pubtype and stage", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes, stages } = await seedCommunity(seed);
		const { getPubsWithRelatedValues } = await import("./pub");

		const allPubs = await getPubsWithRelatedValues(
			{ communityId: community.id },
			{ depth: 10 }
		);

		expect(allPubs.length).toBe(4);

		const [minimalPubs, pubsInStage1, basicPubsInStage1, pubsInNoStage] = await Promise.all([
			getPubsWithRelatedValues(
				{ pubTypeId: [pubTypes["Minimal Pub"].id], communityId: community.id },
				{ withPubType: true, depth: 10 }
			),
			getPubsWithRelatedValues(
				{ stageId: [stages["Stage 1"].id], communityId: community.id },
				{ withStage: true, depth: 10 }
			),
			getPubsWithRelatedValues(
				{
					pubTypeId: [pubTypes["Basic Pub"].id],
					stageId: [stages["Stage 1"].id],
					communityId: community.id,
				},
				{ withPubType: true, withStage: true, depth: 10 }
			),
			getPubsWithRelatedValues(
				// passing ['no-stage'] is different from passing null,
				// as null will just not filter by stage at all
				{ communityId: community.id, stageId: ["no-stage"] },
				{ withPubType: true, withStage: true, depth: 10 }
			),
		]);

		expect(minimalPubs.length).toBe(1);
		expect(minimalPubs[0].pubType?.id).toBe(pubTypes["Minimal Pub"].id);

		expect(pubsInStage1.length).toBe(2);

		expect(basicPubsInStage1.length).toBe(1);
		expect(basicPubsInStage1[0].pubType?.id).toBe(pubTypes["Basic Pub"].id);
		expect(basicPubsInStage1[0].stage?.id).toBe(stages["Stage 1"].id);

		const allPubsWithoutStage = allPubs.filter((p) => p.stageId === null);
		expect(pubsInNoStage.length).toBe(allPubsWithoutStage.length);
		pubsInNoStage.forEach((p) => {
			expect(p.stageId).toBeNull();
		});
	});

	it("should be able to limit the amount of top-level pubs retrieved while still fetching related pubs", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

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
				},
			],
		});

		const { getPubsWithRelatedValues } = await import("./pub");
		const pubs = await getPubsWithRelatedValues(
			{ communityId: newCommunity.community.id },
			{
				depth: 10,
				limit: 3,
				_debugDontNest: true,
				orderBy: "createdAt",
				orderDirection: "desc",
			}
		);

		// 1 root pub with two nested descendants
		expect(pubs.length).toBe(3);
	});

	it("should be able to detect cycles, i.e. not go max-depth deep if a loop is detected", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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

		const { getPubsWithRelatedValues } = await import("./pub");

		const [withCycleIncluded, withCycleExcluded] = (await Promise.all([
			getPubsWithRelatedValues(
				{ pubId: newPubId, communityId: community.id },
				{ depth: 10, _debugDontNest: true }
			),
			getPubsWithRelatedValues(
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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

		const { getPubsWithRelatedValues } = await import("./pub");
		const pubWithRelatedValues = (await getPubsWithRelatedValues(
			{ pubId: newPubId, communityId: community.id },
			{ depth: 10, fieldSlugs: [pubFields.Title.slug, pubFields["Some relation"].slug] }
		)) as unknown as UnprocessedPub[];

		expect(pubWithRelatedValues).toHaveValues([
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
			{ value: "test title" },
		]);
	});

	it("is able to exclude related pubs from being fetched", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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
									[pubFields.Title.slug]: "related pub title",
								},
							},
						},
					],
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");
		const pubWithRelatedValues = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10, withRelatedPubs: false }
		);

		expect(pubWithRelatedValues).toHaveValues([
			{
				value: "test relation value",
			},
			{ value: "test title" },
		]);

		expect(pubWithRelatedValues.values[1].relatedPub).toBeUndefined();
		// check that the relatedPub is `undefined` in type as well as value due to `{withRelatedPubs: false}`
		expectTypeOf(pubWithRelatedValues.values[1]).toMatchTypeOf<{
			relatedPub?: undefined;
		}>();
	});

	it("should be able to retrieve the stage a pub is in", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubs } = await seedCommunity(seed);

		const { getPubsWithRelatedValues } = await import("./pub");

		const pub = await getPubsWithRelatedValues(
			{ pubId: pubs[0].id, communityId: community.id },
			{ withStage: true }
		);

		expectTypeOf(pub).toMatchTypeOf<{ stage: Stages | null }>();

		expect(pub.stage?.name).toBe("Stage 1");
	});

	it("should be able to fetch members", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubs, users } = await seedCommunity(seed);

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

		const { getPubsWithRelatedValues } = await import("./pub");

		const pub = await getPubsWithRelatedValues(
			{ pubId, communityId: community.id, userId: users.admin.id },
			{ withMembers: true }
		);

		pub.members.sort((a, b) => a.slug.localeCompare(b.slug));
		expect(pub).toMatchObject({
			members: newUsers.map((u) => ({ ...u, role: MemberRole.admin })),
		});
	});

	it("should fetch a pub that has no pub values", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubTypes } = await seedCommunity(seed);

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

		const { getPubsWithRelatedValues } = await import("./pub");

		const pub = await getPubsWithRelatedValues({
			pubId: emptyPub.id,
			communityId: community.id,
		});

		expect(pub).toMatchObject({
			id: emptyPub.id,
			values: [],
		});
	});

	it("should not fetch values if withValues is false", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");

		const pub = await getPubsWithRelatedValues(
			{ pubId: createdPub.id, communityId: community.id },
			{ withValues: false }
		);

		expect(pub.values.length).toBe(0);
	});

	it("should be able to filter related pubs by pub type", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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
									[pubFields.Title.slug]: "related pub title",
								},
							},
						},
						{
							value: "test relation value 2",
							pub: {
								pubTypeId: pubTypes["Minimal Pub"].id,
								values: {
									[pubFields.Title.slug]: "related pub title 2",
								},
							},
						},
					],
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");

		const testGet = await getPubsWithRelatedValues({
			pubId: pub.id,
			communityId: community.id,
		});
		expect(testGet).toHaveValues([
			{
				value: "test title",
			},
			{
				value: "test relation value",
				relatedPub: {
					pubTypeId: pubTypes["Basic Pub"].id,
				},
			},
			{
				value: "test relation value 2",
				relatedPub: {
					pubTypeId: pubTypes["Minimal Pub"].id,
				},
			},
		]);

		const pubWithRelatedValues = await getPubsWithRelatedValues(
			{
				pubId: pub.id,
				communityId: community.id,
			},
			{
				allowedPubTypes: [pubTypes["Basic Pub"].id],
			}
		);

		expect(pubWithRelatedValues).toHaveValues([
			{
				value: "test title",
			},
			{
				value: "test relation value",
				relatedPub: {
					pubTypeId: pubTypes["Basic Pub"].id,
				},
			},
		]);
	});

	it("should be able to filter related pubs by stage", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, stages } = await seedCommunity(seed);

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
								stageId: stages["Stage 1"].id,
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "related pub title",
								},
							},
						},
						{
							value: "test relation value 2",
							pub: {
								stageId: stages["Stage 2"].id,
								pubTypeId: pubTypes["Basic Pub"].id,
								values: {
									[pubFields.Title.slug]: "related pub title 2",
								},
							},
						},
						{
							value: "test relation value 3",
							pub: {
								pubTypeId: pubTypes["Basic Pub"].id,
								// no stage
								values: {
									[pubFields.Title.slug]: "related pub title 3",
								},
							},
						},
					],
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");

		const pubWithRelatedValuesNoStage = await getPubsWithRelatedValues(
			{
				pubId: pub.id,
				communityId: community.id,
			},
			{
				allowedStages: ["no-stage"],
			}
		);

		expect(pubWithRelatedValuesNoStage).toHaveValues([
			{
				value: "test title",
			},
			{
				value: "test relation value 3",
				relatedPub: {
					stageId: null,
				},
			},
		]);

		const pubWithRelatedValuesStage1 = await getPubsWithRelatedValues(
			{
				pubId: pub.id,
				communityId: community.id,
			},
			{
				allowedStages: ["no-stage", stages["Stage 1"].id],
			}
		);

		expect(pubWithRelatedValuesStage1).toHaveValues([
			{
				value: "test title",
			},
			{
				value: "test relation value",
				relatedPub: {
					stageId: stages["Stage 1"].id,
				},
			},
			{
				value: "test relation value 3",
				relatedPub: {
					stageId: null,
				},
			},
		]);

		// should not return anything if no-stage is not allowed, as the top-level pub in not in a stage
		await expect(
			getPubsWithRelatedValues(
				{
					pubId: pub.id,
					communityId: community.id,
				},
				{
					allowedStages: [stages["Stage 2"].id],
				}
			)
		).rejects.toThrow("Pub not found");
	});

	it("should get pubs with stage null if only no-stage pubs are allowed", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubs, community, pubFields, pubTypes, stages } = await seedCommunity(
			seed,
			undefined,
			trx
		);

		const { createPubRecursiveNew } = await import("./pub");

		// dummy pub with a stage, all the other have no stage
		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				stageId: stages["Stage 1"].id,
				values: {
					[pubFields.Title.slug]: "test title",
				},
			},
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const { getPubsWithRelatedValues } = await import("./pub");

		const pubsWithNoStage = await getPubsWithRelatedValues(
			{
				communityId: community.id,
			},
			{
				allowedStages: ["no-stage"],
				trx,
			}
		);

		expect(pubsWithNoStage).toHaveLength(2);
		expect(pubsWithNoStage.every((pub) => pub.stageId === null)).toBe(true);

		// also works with singular pub

		const pubWithNoStage = await getPubsWithRelatedValues(
			{
				communityId: community.id,
				pubIds: [pubs[1].id],
			},
			{
				trx,
				allowedStages: ["no-stage"],
			}
		);

		expect(pubWithNoStage).toBeDefined();
		expect(pubWithNoStage[0].stageId).toBe(null);
	});
});

describe("upsertPubRelations", () => {
	it("should be able to add relations to existing pubs", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);

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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");

		const updatedPub = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub).toHaveValues([
			{ value: "test title" },
			{
				value: "test relation value",
				relatedPub: { values: [{ value: "Some title" }] },
			},
		]);
	});

	it("should be able to create new pubs as relations", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const { getPubsWithRelatedValues } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub).toHaveValues([
			{ fieldSlug: pubFields["Title"].slug, value: "test title" },
			{
				fieldSlug: pubFields["Some relation"].slug,
				value: "test relation value",
				relatedPub: { values: [{ value: "new related pub" }] },
			},
		]);
	});

	it("should validate relation values against schema", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(pubFields["Some relation"].slug);
	});

	it("should throw error for fields that do not exist in the community", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow(
			`Pub values contain fields that do not exist in the community: non-existent-field`
		);
	});

	it("should throw error for non-existent related pub id", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
				lastModifiedBy: createLastModifiedBy("system"),
			})
		).rejects.toThrow();
	});

	it("should be able to add multiple relations at once", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const { getPubsWithRelatedValues } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub.values).toHaveLength(3); // title + 2 relations
		expect(updatedPub.values.filter((v) => v.relatedPub)).toHaveLength(2);
	});

	it("should be able to upsert relations - overwriting existing and creating new ones", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
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
			lastModifiedBy: createLastModifiedBy("system"),
			trx,
		});

		const { getPubsWithRelatedValues } = await import("./pub");
		const updatedPub = await getPubsWithRelatedValues(
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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

		const { removePubRelations, getPubsWithRelatedValues } = await import("./pub");

		// check that the pub has 2 relations
		const pubWithRelations = await getPubsWithRelatedValues(
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

		expect(removedRelatedPubIds).toEqual([pubs[0].id]);

		const updatedPub = await getPubsWithRelatedValues(
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(seed);

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

		const { removeAllPubRelationsBySlugs, getPubsWithRelatedValues } = await import("./pub");

		// Verify initial state has 2 relations
		const pubWithRelations = await getPubsWithRelatedValues(
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

		const updatedPub = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		// Should only have title value left
		expect(updatedPub.values).toHaveLength(1);
		expect(updatedPub.values.find((v) => v.relatedPub)).toBeUndefined();
	});

	it("should throw error when field slug does not exist", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);

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

describe("replacePubRelationsBySlug", () => {
	it("should replace all relations for given field slugs with new relations", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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

		const { replacePubRelationsBySlug, getPubsWithRelatedValues } = await import("./pub");

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
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const updatedPub = await getPubsWithRelatedValues(
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
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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

		const { replacePubRelationsBySlug, getPubsWithRelatedValues } = await import("./pub");

		await replacePubRelationsBySlug({
			pubId: pub.id,
			relations: [],
			communityId: community.id,
			lastModifiedBy: createLastModifiedBy("system"),
		});

		const updatedPub = await getPubsWithRelatedValues(
			{ pubId: pub.id, communityId: community.id },
			{ depth: 10 }
		);

		expect(updatedPub.values.filter((v) => v.relatedPub)).toHaveLength(0);
	});

	it("should throw error when field slug does not exist", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes } = await seedCommunity(seed);
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
