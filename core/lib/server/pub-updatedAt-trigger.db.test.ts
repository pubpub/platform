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
			lastModifiedBy: "system",
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
				lastModifiedBy: "system",
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
			const trx = testDb;

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
			const trx = testDb;

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
			const trx = testDb;

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
			const trx = testDb;

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
			const trx = testDb;

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
			const trx = testDb;

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
			const trx = testDb;

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
