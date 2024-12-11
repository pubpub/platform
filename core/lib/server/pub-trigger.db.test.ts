import { describe, expect, it } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { mockServerCode } from "../__tests__/utils";

const { testDb } = await mockServerCode();
const { seedCommunity, createSeed } = await import("~/prisma/seed/seedCommunity");

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
			Description: { isTitle: false },
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

// this is testing the trigger defined in prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
describe("updatedAt trigger", () => {
	it("should update the updatedAt timestamp on a pub whenever a pubvalue is updated, inserted, or deleted", async () => {
		// we explicitly do not do this inside of a transaction
		// as otherwise the triggers will not, you know, trigger
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

		const compareUpdatedAt = async (updatedAtBefore: Date) => {
			const newPub = await testDb
				.selectFrom("pubs")
				.select("updatedAt")
				.where("id", "=", pub.id)
				.executeTakeFirstOrThrow();

			expect(newPub.updatedAt.getTime()).toBeGreaterThan(updatedAtBefore.getTime());

			return newPub.updatedAt;
		};

		// update some pub value

		const insertResult = await testDb
			.insertInto("pub_values")
			.values({
				pubId: pub.id,
				fieldId: pubFields.Description.id,
				value: JSON.stringify("description"),
			})
			.executeTakeFirst();

		expect(insertResult.numInsertedOrUpdatedRows).toBe(BigInt(1));

		const afterInsertUpdatedAt = await compareUpdatedAt(pub.updatedAt);

		// making sure it's a non-title field to make sure the trigger is working as expected
		const updateResult = await testDb
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new description"),
			})
			.where((eb) =>
				eb.and([eb("pubId", "=", pub.id), eb("fieldId", "=", pubFields.Description.id)])
			)
			.executeTakeFirst();

		const afterUpdateUpdatedAt = await compareUpdatedAt(afterInsertUpdatedAt);

		const insertOnConflict = await testDb
			.insertInto("pub_values")
			.values({
				pubId: pub.id,
				fieldId: pubFields.Description.id,
				value: JSON.stringify("newer description"),
			})
			// this is similar to what we do in updatePub
			.onConflict((oc) =>
				oc
					.columns(["pubId", "fieldId"])
					.where("relatedPubId", "is", null)
					// upsert
					.doUpdateSet((eb) => ({
						value: eb.ref("excluded.value"),
					}))
			)
			.executeTakeFirstOrThrow();

		expect(insertOnConflict.numInsertedOrUpdatedRows).toBe(BigInt(1));

		const afterInsertOnConflictUpdatedAt = await compareUpdatedAt(afterUpdateUpdatedAt);

		const deleteResult = await testDb
			.deleteFrom("pub_values")
			.where((eb) =>
				eb.and([eb("pubId", "=", pub.id), eb("fieldId", "=", pubFields.Description.id)])
			)
			.executeTakeFirst();

		expect(deleteResult.numDeletedRows).toBe(BigInt(1));

		await compareUpdatedAt(afterInsertOnConflictUpdatedAt);
	});
});

describe("pub_values title trigger", () => {
	it("should set a title on a pub when a pub is created with a title", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
			trx: testDb,
		});

		expect(createdPub.title).toBe("Test pub");
	});

	it("should not set a title on a pub when a pub is created without a title", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Description.slug]: "description",
				},
			},
		});

		expect(createdPub.title).toBe(null);
	});

	it("should update a title on a pub when a pubvalue is updated", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		expect(createdPub.title).toBe("Test pub");

		const updatedPubValue = await testDb
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new title"),
			})
			.where("pubId", "=", createdPub.id)
			.where("fieldId", "=", pubFields.Title.id)
			.returningAll()
			.executeTakeFirstOrThrow();

		const pub = await testDb
			.selectFrom("pubs")
			.selectAll()
			.where("id", "=", createdPub.id)
			.executeTakeFirstOrThrow();

		expect(pub.title).toBe("new title");
	});

	it("should not update a title on a pub when a non-title pubvalue is updated", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		expect(createdPub.title).toBe("Test pub");

		const updateResult = await testDb
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new description"),
			})
			.where("pubId", "=", createdPub.id)
			.where("fieldId", "=", pubFields.Description.id)
			.executeTakeFirst();

		const updatedPub = await testDb
			.selectFrom("pubs")
			.selectAll()
			.where("id", "=", createdPub.id)
			.executeTakeFirstOrThrow();

		expect(updatedPub.title).toBe("Test pub");
	});

	it("should delete a title on a pub when a pubvalue is deleted", async () => {
		const { createPubRecursiveNew } = await import("./pub");

		const createdPub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
		});

		const deletedPubValue = await testDb
			.deleteFrom("pub_values")
			.where("pubId", "=", createdPub.id)
			.where("fieldId", "=", pubFields.Title.id)
			.returningAll()
			.executeTakeFirstOrThrow();

		const pub = await testDb
			.selectFrom("pubs")
			.selectAll()
			.where("id", "=", createdPub.id)
			.executeTakeFirstOrThrow();

		expect(pub.title).toBe(null);
	});
});

const getPubTitle = async (pubId: PubsId) => {
	return (
		await testDb
			.selectFrom("pubs")
			.select("title")
			.where("id", "=", pubId)
			.executeTakeFirstOrThrow()
	).title;
};

const pubTitleTestSeed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			Description: { isTitle: false },
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
				Description: "Some description",
			},
		},
	],
});

// when a pubType is updated, we need to update the title of all pubs in that pubType
describe("pubType title change trigger", () => {
	it("should update titles when a field is marked as title", async () => {
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(pubTitleTestSeed);

		expect(pubs[0].title).toBe("Some title");
		expect(await getPubTitle(pubs[0].id)).toBe("Some title");

		// Change the title field from Title to Description
		await testDb
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe(null);

		await testDb
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: true })
			.where("A", "=", pubFields.Description.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe("Some description");
	});

	it("should set title to null when no field is marked as title", async () => {
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(pubTitleTestSeed);

		// Remove title designation from the Title field
		const updateResult = await testDb
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		const updatedPub = await testDb
			.selectFrom("pubs")
			.selectAll()
			.where("id", "=", pubs[0].id)
			.executeTakeFirstOrThrow();

		expect(updatedPub.title).toBe(null);
	});

	it("should update titles for all pubs in the pub type", async () => {
		const { community, pubFields, pubTypes, pubs } = await seedCommunity({
			...pubTitleTestSeed,
			pubs: [
				{
					pubType: "Basic Pub",
					values: {
						Title: "First title",
						Description: "First description",
					},
				},
				{
					pubType: "Basic Pub",
					values: {
						Title: "Second title",
						Description: "Second description",
					},
				},
			],
		});

		expect(pubs[0].title).toBe("First title");
		expect(pubs[1].title).toBe("Second title");

		// Change the title field from Title to Description
		await testDb
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe(null);
		expect(await getPubTitle(pubs[1].id)).toBe(null);

		await testDb
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: true })
			.where("A", "=", pubFields.Description.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe("First description");
		expect(await getPubTitle(pubs[1].id)).toBe("Second description");
	});

	it("should set title to null when a pubfield is removed from a pubtype", async () => {
		const { community, pubFields, pubTypes, pubs } = await seedCommunity(pubTitleTestSeed);

		expect(pubs[0].title).toBe("Some title");

		// Remove the Title field from the pubType
		await testDb
			.deleteFrom("_PubFieldToPubType")
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe(null);
	});

	it("should update title when a pubfield is added as a title", async () => {
		const { community, pubFields, pubTypes, pubs } = await seedCommunity({
			...pubTitleTestSeed,
			pubTypes: {
				"Basic Pub": {
					Description: { isTitle: false },
				},
			},
			pubs: [
				{
					pubType: "Basic Pub",
					values: {
						Title: "Some title",
						Description: "Some description",
					},
				},
				{
					pubType: "Basic Pub",
					values: {
						Description: "Some description",
					},
				},
			],
			forms: {},
		});

		expect(await getPubTitle(pubs[0].id)).toBe(null);

		await testDb
			.insertInto("_PubFieldToPubType")
			.values({
				A: pubFields.Title.id,
				B: pubTypes["Basic Pub"].id,
				isTitle: true,
			})
			.execute();

		expect(await getPubTitle(pubs[0].id)).toBe("Some title");
		expect(
			await getPubTitle(pubs[1].id),
			"Inserts should not update titles of pubs without a title"
		).toBe(null);
	});
});
