import { describe, expect, it } from "vitest";

import type { ActionRunsId, ApiAccessTokensId, PubsId, PubValuesHistoryHistId } from "db/public";
import { Action, ActionRunStatus, CoreSchemaType, MemberRole } from "db/public";
import { OperationType } from "db/src/public/OperationType";

import {
	isCheckContraintError,
	isPostgresError,
	parseForeignKeyConstraintError,
} from "~/kysely/errors";
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
				lastModifiedBy: "system",
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
				lastModifiedBy: "system",
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
				lastModifiedBy: "system",
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

const pubValuesHistoryTestSeed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub-2",
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		Field1: { schemaName: CoreSchemaType.String },
		Field2: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			Description: { isTitle: false },
			Field1: { isTitle: false },
			Field2: { isTitle: false },
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
});
describe("pub_values_history trigger", () => {
	describe("basic functioning", () => {
		it("should create a pub_values_history row when a pubvalue is inserted", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const insertResult = await trx
				.insertInto("pub_values")
				.values({
					pubId: pubs[0].id,
					fieldId: pubFields.Description.id,
					value: JSON.stringify("description"),
					lastModifiedBy: `system`,
				})
				.returning("id")
				.executeTakeFirstOrThrow();

			const history = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", insertResult.id)
				.executeTakeFirstOrThrow();

			expect(history).toMatchObject({
				operationType: "insert",
				oldRowData: null,
				newRowData: {
					value: "description",
				},
				primaryKeyValue: insertResult.id,
				userId: null,
				apiAccessTokenId: null,
				actionRunId: null,
				other: "system",
			});
		});

		it("should create a pub_values_history row when a pubvalue is updated", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;

			const updateResult = await trx
				.updateTable("pub_values")
				.set({
					value: JSON.stringify("new title"),
				})
				.where("id", "=", titlePubValueId)
				.executeTakeFirstOrThrow();

			const history = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", titlePubValueId)
				.where("operationType", "=", OperationType.update)
				.executeTakeFirstOrThrow();

			expect(history).toMatchObject({
				operationType: "update",
				oldRowData: {
					value: "Some title",
				},
				newRowData: {
					value: "new title",
				},
			});
		});

		it("should create an update pub_values_history row when a pubvalue is inserted on conflict", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;
			const insertHistory = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", titlePubValueId)
				.execute();

			expect(insertHistory.length).toBe(1);
			expect(insertHistory[0]).toMatchObject({
				operationType: "insert",
				oldRowData: null,
				newRowData: {
					value: "Some title",
				},
			});

			const insertResult = await trx
				.insertInto("pub_values")
				.values({
					pubId: pubs[0].id,
					fieldId: pubFields.Title.id,
					value: JSON.stringify("new title"),
					lastModifiedBy: `system`,
				})
				.returning("id")
				.onConflict((oc) =>
					oc
						.columns(["pubId", "fieldId"])
						.where("relatedPubId", "is", null)
						.doUpdateSet((eb) => ({
							value: eb.ref("excluded.value"),
						}))
				)
				.executeTakeFirstOrThrow();

			const history = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", insertResult.id)
				.execute();

			expect(history.length).toBe(2);
			expect(history[1]).toMatchObject({
				operationType: "update",
				oldRowData: {
					value: "Some title",
				},
				newRowData: {
					value: "new title",
				},
			});
		});
	});

	describe("handling different types of lastModifiedBy", () => {
		it("should allow setting lastModifiedBy to 'unknown' or 'system'", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;

			const basicModifiedsPromise = (["unknown", "system"] as const).map((modifiedBy) => {
				return trx
					.updateTable("pub_values")
					.set({
						value: JSON.stringify(modifiedBy),
						lastModifiedBy: modifiedBy,
					})
					.where("id", "=", titlePubValueId)
					.returningAll()
					.executeTakeFirstOrThrow();
			});

			const basicModifieds = await Promise.allSettled(basicModifiedsPromise);

			basicModifieds.forEach((result) => {
				expect(result.status).toBe("fulfilled");
			});

			const history = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", titlePubValueId)
				.orderBy("createdAt", "desc")
				.limit(2)
				.execute();

			expect(history.length).toBe(2);

			expect(history[0]).toMatchObject({
				newRowData: {
					value: "system",
				},
				other: "system",
				operationType: "update",
			});
			expect(history[1]).toMatchObject({
				newRowData: {
					value: "unknown",
				},
				other: null,
				operationType: "update",
				actionRunId: null,
				apiAccessTokenId: null,
				userId: null,
			});
		});

		const tokenId = crypto.randomUUID();
		const token = `${tokenId}.${crypto.randomUUID()}` as const;
		const multiCommunityTestSeed = createSeed({
			...pubValuesHistoryTestSeed,
			users: {
				"user-1": {
					role: MemberRole.admin,
				},
			},
			stages: {
				"Stage 1": {
					actions: [
						{
							action: Action.log,
							name: "Log Action",
							config: {
								debounce: 1000,
							},
						},
					],
				},
			},
		});

		it("should allow setting lastModifiedBy to a user id, api-token, and actionRunId, and set them to null when removed", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs, users, actions, apiToken } = await seedCommunity(
				multiCommunityTestSeed,
				{
					withApiToken: token,
				},
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;

			const actionRun = await trx
				.insertInto("action_runs")
				.values({
					actionInstanceId: actions[0].id,
					pubId: pubs[0].id,
					status: ActionRunStatus.success,
					result: JSON.stringify({
						message: "test",
					}),
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			const perpetrators = [
				{
					lastModifiedBy: `user:${users["user-1"].id}`,
					foreignKey: "userId",
					value: users["user-1"].id,
				},
				{
					lastModifiedBy: `api-access-token:${tokenId}`,
					foreignKey: "apiAccessTokenId",
					value: tokenId,
				},
				{
					lastModifiedBy: `action-run:${actionRun.id}`,
					foreignKey: "actionRunId",
					value: actionRun.id,
				},
			] as const;

			let historyKeys: PubValuesHistoryHistId[] = [];
			for (const perpetrator of perpetrators) {
				const updateResult = await trx
					.updateTable("pub_values")
					.set({
						value: JSON.stringify(perpetrator.value),
						lastModifiedBy: perpetrator.lastModifiedBy,
					})
					.where("id", "=", titlePubValueId)
					.executeTakeFirstOrThrow();

				const history = await trx
					.selectFrom("pub_values_history")
					.selectAll()
					.where("primaryKeyValue", "=", titlePubValueId)
					.orderBy("createdAt", "desc")
					.executeTakeFirstOrThrow();

				historyKeys.push(history.histId);

				expect(history).toMatchObject({
					operationType: "update",
					newRowData: {
						value: perpetrator.value,
					},
					[perpetrator.foreignKey]: perpetrator.value,
				});
			}

			const removeApiToken = await trx
				.deleteFrom("api_access_tokens")
				.where("id", "=", tokenId as ApiAccessTokensId)
				.executeTakeFirst();
			expect(removeApiToken.numDeletedRows).toBe(BigInt(1));

			const removeActionRun = await trx
				.deleteFrom("action_runs")
				.where("id", "=", actionRun.id as ActionRunsId)
				.executeTakeFirst();
			expect(removeActionRun.numDeletedRows).toBe(BigInt(1));

			const removeUser = await trx
				.deleteFrom("users")
				.where("id", "=", users["user-1"].id)
				.executeTakeFirst();
			expect(removeUser.numDeletedRows).toBe(BigInt(1));

			const history = await trx
				.selectFrom("pub_values_history")
				.selectAll()
				.where("primaryKeyValue", "=", titlePubValueId)
				.where("histId", "in", historyKeys)
				.orderBy("createdAt", "desc")
				.execute();

			expect(history.length).toBe(3);
			history.forEach((h) =>
				expect(
					h,
					"history perpetrators should be nulled if they are removed"
				).toMatchObject({
					operationType: "update",
					other: null,
					userId: null,
					apiAccessTokenId: null,
					actionRunId: null,
				})
			);
		});

		const isModifiedByCheckConstraintError = (error: unknown) =>
			isCheckContraintError(error) && error.constraint === "modified_by_type_check";

		it("should throw a constraint error if lastModifiedBy is not a valid uuid", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;

			try {
				await trx
					.updateTable("pub_values")
					.set({
						lastModifiedBy: `user:not-a-user`,
					})
					.where("id", "=", titlePubValueId)
					.executeTakeFirst();
			} catch (e) {
				expect(isModifiedByCheckConstraintError(e)).toBe(true);
			}
		});

		it("should throw a different error if it is a valid id, but not a valid foreign key", async () => {
			const trx = getTrx();

			const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
			const { pubFields, pubs } = await seedCommunity(
				pubValuesHistoryTestSeed,
				undefined,
				trx
			);

			const titlePubValueId = pubs[0].values.find(
				(v) => v.fieldId === pubFields.Title.id
			)?.id!;

			const randomUserId = crypto.randomUUID();
			try {
				await trx
					.updateTable("pub_values")
					.set({ lastModifiedBy: `user:${randomUserId}` })
					.where("id", "=", titlePubValueId)
					.executeTakeFirst();
			} catch (e) {
				expect(isPostgresError(e)).toBe(true);
				expect(parseForeignKeyConstraintError(e)).toMatchObject({
					foreignKey: {
						key: "userId",
						value: randomUserId,
						table: "users",
					},
				});
			}
		});
	});
});
