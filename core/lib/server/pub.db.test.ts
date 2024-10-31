import { beforeAll, describe, expect, it } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

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
			Title: true,
			"Some relation": true,
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
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
	stages: {
		"Stage 1": {},
	},
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
					[pubFields["Some relation"].slug]: {
						value: "test relation value",
						relatedPubId: pubs[0].id,
					},
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
		const pubValues = await getPubsWithRelatedValuesAndChildren({ pubId: rootPubId }, 10);

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
			10
		);

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
			10
		);

		expect(pubWithRelatedValuesAndChildren.length).toBe(5);

		const submisionPubs = await getPubsWithRelatedValuesAndChildren(
			{ pubTypeId: pubTypes["Basic Pub"].id },
			10,
			{ includePubType: true }
		);
	});

	it("should be able to search", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Hello friend",
				},
				children: [
					{
						pubTypeId: pubTypes["Basic Pub"].id,
						values: { [pubFields.Title.slug]: "Hello ENEMY" },
					},
				],
			},
			trx,
		});

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubWithRelatedValuesAndChildren = await getPubsWithRelatedValuesAndChildren(
			{ communityId: community.id },
			10,
			{ search: "friend" }
		);

		expect(pubWithRelatedValuesAndChildren.length).toBe(1);
		expect(pubWithRelatedValuesAndChildren[0].values[0].value).toBe("Hello friend");
	});

	it("should be able to limit the amount of top-level pubs retrieved", async () => {
		const trx = getTrx();

		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");
		const pubs = await getPubsWithRelatedValuesAndChildren({ communityId: community.id }, 1, {
			limit: 1,
		});

		expect(pubs.length).toBe(1);
	});

});
