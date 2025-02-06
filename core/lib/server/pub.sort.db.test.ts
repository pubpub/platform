import { v4 as uuidv4 } from "uuid";
import { describe, expect, it } from "vitest";

import type { CreatePubRequestBodyWithNullsNew } from "contracts";
import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";
import { createLastModifiedBy } from "../lastModifiedBy";

const { createSeed, seedCommunity } = await import("~/prisma/seed/seedCommunity");

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx, rollback } = createForEachMockedTransaction();

const seed = createSeed({
	community: {
		name: "pub sort test",
		slug: "test-server-pub-sort",
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
		"Stage 2": {},
	},
	stageConnections: {
		"Stage 1": {
			to: ["Stage 2"],
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

const { community, pubFields, pubTypes, stages, users } = await seedCommunity(seed);

describe("getPubsWithRelatedValuesAndChildren", () => {
	it("should sort pubs by updatedAt", async () => {
		const {
			createPubRecursiveNew,
			removeAllPubRelationsBySlugs,
			getPubsWithRelatedValuesAndChildren,
			upsertPubRelations: addPubRelations,
		} = await import("./pub");
		const { movePub } = await import("./stages");

		// Create a bunch of pubs with relations to each other, since those can impact query results
		const pubIds = [...Array(50)].map(() => uuidv4() as PubsId);
		for (let i = 0; i < pubIds.length; i++) {
			const pubId = pubIds[i];
			const shouldRelate = i > 0 && i % 2 === 0;
			const relatedPubId = shouldRelate ? pubIds[i / 2] : undefined;

			const values: CreatePubRequestBodyWithNullsNew["values"] = {
				[pubFields.Title.slug]: `Test pub ${i}`,
			};
			if (shouldRelate && relatedPubId !== undefined) {
				values[pubFields["Some relation"].slug] = [
					{
						relatedPubId,
						value: "",
					},
				];
			}

			await createPubRecursiveNew({
				communityId: community.id,
				body: {
					pubTypeId: pubTypes["Basic Pub"].id,
					id: pubId,
					values,
					stageId: stages[`Stage ${((i % 2) + 1) as 1 | 2}`].id,
				},
				lastModifiedBy: createLastModifiedBy("system"),
			});
		}

		// Modify a few pubs in a few different ways to update their updatedAt
		await removeAllPubRelationsBySlugs({
			pubId: pubIds[2],
			communityId: community.id,
			slugs: [pubFields["Some relation"].slug],
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await addPubRelations({
			pubId: pubIds[10],
			communityId: community.id,
			relations: [
				{
					slug: pubFields["Some relation"].slug,
					value: "relation 1",
					relatedPubId: pubIds[20],
				},
			],
			lastModifiedBy: createLastModifiedBy("system"),
		});

		await movePub(pubIds[4], stages["Stage 2"].id).execute();

		// Fetch pubs with and without limits, and with/without values
		const [stage1pubs, stage2pubs, allPubs] = await Promise.all([
			getPubsWithRelatedValuesAndChildren(
				{
					communityId: community.id,
					stageId: stages["Stage 1"].id,
				},
				{
					limit: 50,
					orderBy: "updatedAt",
					withRelatedPubs: false,
					withValues: false,
					withStage: true,
				}
			),
			getPubsWithRelatedValuesAndChildren(
				{
					communityId: community.id,
					stageId: stages["Stage 2"].id,
				},
				{
					limit: 50,
					orderBy: "updatedAt",
					withRelatedPubs: false,
					withValues: false,
					withStage: true,
				}
			),
			getPubsWithRelatedValuesAndChildren(
				{
					communityId: community.id,
				},
				{
					orderBy: "updatedAt",
					withRelatedPubs: true,
					withStage: true,
				}
			),
		]);

		expect(stage1pubs[0].title).toBe("Test pub 10");
		expect(stage1pubs[1].title).toBe("Test pub 2");
		expect(stage2pubs[0].title).toBe("Test pub 4");
		expect(allPubs[0].title).toBe("Test pub 4");
		expect(allPubs[1].title).toBe("Test pub 10");
		expect(allPubs[2].title).toBe("Test pub 2");
	});
});
