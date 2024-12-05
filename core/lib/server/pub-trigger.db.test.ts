import { describe, expect, it } from "vitest";

import type { PubsId } from "db/public";
import { CoreSchemaType } from "db/public";

import { mockServerCode } from "../__tests__/utils";

const { testDb } = await mockServerCode();
const { seedCommunity } = await import("~/prisma/seed/seedCommunity");

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
		const updateResult = await testDb
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new title"),
			})
			.where((eb) =>
				eb.and([eb("pubId", "=", pub.id), eb("fieldId", "=", pubFields.Title.id)])
			)
			.executeTakeFirst();

		const afterUpdateUpdatedAt = await compareUpdatedAt(pub.updatedAt);

		const insertResult = await testDb
			.insertInto("pub_values")
			.values({
				pubId: pub.id,
				fieldId: pubFields.Description.id,
				value: JSON.stringify("description"),
			})
			.executeTakeFirst();

		expect(insertResult.numInsertedOrUpdatedRows).toBe(BigInt(1));

		const afterInsertUpdatedAt = await compareUpdatedAt(afterUpdateUpdatedAt);

		const insertOnConflict = await testDb
			.insertInto("pub_values")
			.values({
				pubId: pub.id,
				fieldId: pubFields.Description.id,
				value: JSON.stringify("new description"),
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

		const afterInsertOnConflictUpdatedAt = await compareUpdatedAt(afterInsertUpdatedAt);

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

describe("title trigger", () => {
	it("should update the title on a pub whenever a pubvalue is updated, inserted, or deleted", async () => {
		const { createPubRecursiveNew, getPubsWithRelatedValuesAndChildren } = await import(
			"./pub"
		);

		const pub = await createPubRecursiveNew({
			communityId: community.id,
			body: {
				pubTypeId: pubTypes["Basic Pub"].id,
				values: {
					[pubFields.Title.slug]: "Test pub",
				},
			},
			trx: testDb,
		});

		const pubWithTitle = await getPubsWithRelatedValuesAndChildren(
			{
				pubId: pub.id,
				communityId: community.id,
			},
			{
				trx: testDb,
			}
		);
		expect.soft(pubWithTitle.title).toBe("Test pub");

		const hng = await testDb
			.updateTable("pub_values")
			.set({
				value: JSON.stringify("new title"),
			})
			.where("pubId", "=", pub.id)
			.where("fieldId", "=", pubFields.Title.id)
			.returningAll()
			.executeTakeFirst();

		const pubWithTitle2 = await testDb
			.selectFrom("pubs")
			.selectAll()
			.where("id", "=", pub.id)
			.executeTakeFirstOrThrow();

		expect.soft(pubWithTitle2.title).toBe("new title");
	});
});
