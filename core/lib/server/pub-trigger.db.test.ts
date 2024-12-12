import { describe, expect, it } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { mockServerCode } from "../__tests__/utils";

const { testDb, createForEachMockedTransaction, createSingleMockedTransaction } =
	await mockServerCode();
const { getTrx, rollback, commit } = createForEachMockedTransaction(testDb);

const { createSeed } = await import("~/prisma/seed/seedCommunity");

const pubTriggerTestSeed = createSeed({
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
	forms: {},
});

// this is testing the trigger defined in prisma/migrations/20241126113759_add_pub_values_updated_at_trigger/migration.sql
describe("updatedAt trigger", () => {
	it("should update the updatedAt timestamp on a pub whenever a pubvalue is updated, inserted, or deleted", async () => {
		// we can't do this inside of a transaction and roll it back,
		// bc the timestamp inside of one transaction will not change
		// therefore we persist this to the db
		const trx = testDb;
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(pubTriggerTestSeed, undefined, trx);

		const pub = pubs[0];

		const compareUpdatedAt = async (updatedAtBefore: Date, message?: string) => {
			const newPub = await trx
				.selectFrom("pubs")
				.select("updatedAt")
				.where("id", "=", pub.id)
				.executeTakeFirstOrThrow();

			expect(newPub.updatedAt.getTime(), message).toBeGreaterThan(updatedAtBefore.getTime());

			return newPub.updatedAt;
		};

		const deleteResult = await trx
			.deleteFrom("pub_values")
			.where((eb) =>
				eb.and([eb("pubId", "=", pub.id), eb("fieldId", "=", pubFields.Description.id)])
			)
			.executeTakeFirstOrThrow();

		expect(deleteResult.numDeletedRows).toBe(BigInt(1));

		await compareUpdatedAt(pub.updatedAt, "Delete should update updatedAt");

		// update some pub value

		const insertResult = await trx
			.insertInto("pub_values")
			.values({
				pubId: pub.id,
				fieldId: pubFields.Description.id,
				value: JSON.stringify("description"),
			})
			.executeTakeFirstOrThrow();

		expect(insertResult.numInsertedOrUpdatedRows).toBe(BigInt(1));

		const afterInsertUpdatedAt = await compareUpdatedAt(
			pub.updatedAt,
			"Insert should update updatedAt"
		);

		// making sure it's a non-title field to make sure the trigger is working as expected
		const updateResult = await trx
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new description"),
			})
			.where((eb) =>
				eb.and([eb("pubId", "=", pub.id), eb("fieldId", "=", pubFields.Description.id)])
			)
			.executeTakeFirstOrThrow();

		const afterUpdateUpdatedAt = await compareUpdatedAt(
			afterInsertUpdatedAt,
			"Update should update updatedAt"
		);

		const insertOnConflict = await trx
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

		const afterInsertOnConflictUpdatedAt = await compareUpdatedAt(
			afterUpdateUpdatedAt,
			"Insert on conflict should update updatedAt"
		);
	});
});

const getPubTitle = async (pubId: PubsId, trx = testDb) => {
	return (
		await trx
			.selectFrom("pubs")
			.select("title")
			.where("id", "=", pubId)
			.executeTakeFirstOrThrow()
	).title;
};

describe("pub_values title trigger", () => {
	it("should set a title on a pub when a pub is created with a title", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

		const { pubs } = await seedCommunity(
			{
				...pubTriggerTestSeed,
				pubs: [
					{
						pubType: "Basic Pub",
						values: {
							Title: "Test pub",
						},
					},
				],
			},
			undefined,
			trx
		);

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Test pub");
	});

	it("should not set a title on a pub when a pub is created without a title", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

		const { pubFields, pubs } = await seedCommunity(
			{
				...pubTriggerTestSeed,
				pubs: [
					{
						pubType: "Basic Pub",
						values: {
							Description: "Some description",
						},
					},
				],
			},
			undefined,
			trx
		);

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
	});

	it("should update a title on a pub when a pubvalue is updated", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(pubTriggerTestSeed, undefined, trx);

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");

		const updatedPubValue = await trx
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new title"),
			})
			.where("pubId", "=", pubs[0].id)
			.where("fieldId", "=", pubFields.Title.id)
			.returningAll()
			.executeTakeFirstOrThrow();

		expect(updatedPubValue).toBeDefined();

		expect(await getPubTitle(pubs[0].id, trx), "AA").toBe("new title");
	});

	it("can handle the highly unusual scenario where a title value is set to null", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(pubTriggerTestSeed, undefined, trx);

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");

		// this normally wouldn't be allowed due to validation, but we're just testing the trigger
		await trx
			.updateTable("pub_values")
			.set({
				value: null,
			})
			.where("pubId", "=", pubs[0].id)
			.where("fieldId", "=", pubFields.Title.id)
			.executeTakeFirstOrThrow();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
	});

	it("should set a title on a pub when a pubvalue is inserted", async () => {
		const trx = testDb;
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(
			{
				...pubTriggerTestSeed,
				pubs: [
					{
						pubType: "Basic Pub",
						values: {
							Description: "Some description",
						},
					},
				],
			},
			undefined,
			trx
		);

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);

		const insertResult = await trx
			.insertInto("pub_values")
			.values({
				pubId: pubs[0].id,
				fieldId: pubFields.Title.id,
				value: JSON.stringify("new title"),
			})
			.executeTakeFirstOrThrow();

		expect(insertResult.numInsertedOrUpdatedRows).toBe(BigInt(1));

		expect(await getPubTitle(pubs[0].id, trx)).toBe("new title");

		const updateResult = await trx
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("newer title"),
			})
			.where("pubId", "=", pubs[0].id)
			.where("fieldId", "=", pubFields.Title.id)
			.executeTakeFirstOrThrow();

		expect(updateResult.numUpdatedRows).toBe(BigInt(1));

		expect(await getPubTitle(pubs[0].id, trx)).toBe("newer title");
	});

	it("should not update a title on a pub when a non-title pubvalue is updated", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(pubTriggerTestSeed);

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");

		const updateResult = await trx
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new description"),
			})
			.where("pubId", "=", pubs[0].id)
			.where("fieldId", "=", pubFields.Description.id)
			.executeTakeFirst();

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");
	});

	it("should delete a title on a pub when a pubvalue is deleted", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubs } = await seedCommunity(pubTriggerTestSeed);

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");

		const deletedPubValue = await trx
			.deleteFrom("pub_values")
			.where("pubId", "=", pubs[0].id)
			.where("fieldId", "=", pubFields.Title.id)
			.returningAll()
			.executeTakeFirstOrThrow();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
	});
});

// when a pubType is updated, we need to update the title of all pubs in that pubType
describe("pubType title change trigger", () => {
	it("should update titles when a field is marked as title", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubTypes, pubs } = await seedCommunity(
			pubTriggerTestSeed,
			undefined,
			trx
		);

		expect(pubs[0].title).toBe("Some title");
		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");

		// Change the title field from Title to Description
		await trx
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);

		await trx
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: true })
			.where("A", "=", pubFields.Description.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some description");
	});

	it("should set title to null when no field is marked as title", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubTypes, pubs } = await seedCommunity(
			pubTriggerTestSeed,
			undefined,
			trx
		);

		// Remove title designation from the Title field
		await trx
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
	});

	it("should update titles for all pubs in the pub type", async () => {
		const trx = getTrx();

		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, pubs } = await seedCommunity({
			...pubTriggerTestSeed,
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

		expect(await getPubTitle(pubs[0].id, trx)).toBe("First title");
		expect(await getPubTitle(pubs[1].id, trx)).toBe("Second title");

		// Change the title field from Title to Description
		await trx
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: false })
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
		expect(await getPubTitle(pubs[1].id, trx)).toBe(null);

		await trx
			.updateTable("_PubFieldToPubType")
			.set({ isTitle: true })
			.where("A", "=", pubFields.Description.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe("First description");
		expect(await getPubTitle(pubs[1].id, trx)).toBe("Second description");
	});

	it("should set title to null when a pubfield is removed from a pubtype", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubTypes, pubs } = await seedCommunity(
			pubTriggerTestSeed,
			undefined,
			trx
		);

		expect(pubs[0].title).toBe("Some title");

		// Remove the Title field from the pubType
		await trx
			.deleteFrom("_PubFieldToPubType")
			.where("A", "=", pubFields.Title.id)
			.where("B", "=", pubTypes["Basic Pub"].id)
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);
	});

	it("should update title when a pubfield is added as a title", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { pubFields, pubTypes, pubs } = await seedCommunity(
			{
				...pubTriggerTestSeed,
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
			},
			undefined,
			trx
		);

		expect(await getPubTitle(pubs[0].id, trx)).toBe(null);

		await trx
			.insertInto("_PubFieldToPubType")
			.values({
				A: pubFields.Title.id,
				B: pubTypes["Basic Pub"].id,
				isTitle: true,
			})
			.execute();

		expect(await getPubTitle(pubs[0].id, trx)).toBe("Some title");
		expect(
			await getPubTitle(pubs[1].id, trx),
			"Inserts should not update titles of pubs without a title"
		).toBe(null);
	});
});
