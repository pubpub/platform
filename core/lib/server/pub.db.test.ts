import { beforeAll, describe, expect, it } from "vitest";

import { CoreSchemaType } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { seedCommunity } from "~/prisma/seed/seedCommunity";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const { community, pubTypes, stages, pubs } = await seedCommunity({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
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
	],
	stages: {
		"Stage 1": {},
	},
	users: {},
});

// beforeAll(async () => {
// });

describe("createPubRecursive", () => {
	it("should be able to create a simple pub", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes[0].id,
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
				pubTypeId: pubTypes[0].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
				children: [
					{
						pubTypeId: pubTypes[0].id,
						values: {
							[`${community.slug}:title`]: "test child title",
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
				pubTypeId: pubTypes[0].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
				stageId: stages[0].id,
			},
			trx,
		});

		expect(pub).toMatchObject({
			stageId: stages[0].id,
			values: [{ value: "test title" }],
		});
	});

	it("should be able to create a relation pub value with direct linking", async () => {
		const trx = getTrx();
		const { createPubRecursiveNew } = await import("./pub");

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes[0].id,
				values: {
					[`${community.slug}:title`]: "test title",
					[`${community.slug}:some-relation`]: {
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
				pubTypeId: pubTypes[0].id,
				values: {
					[`${community.slug}:title`]: "test title",
				},
				relatedPubs: {
					[`${community.slug}:some-relation`]: [
						{
							value: "test relation value",
							pub: {
								pubTypeId: pubTypes[0].id,
								values: {
									[`${community.slug}:title`]: "test relation title",
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
