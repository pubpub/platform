import { describe } from "node:test";

import { Kysely, PostgresDialect } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { expect, it, vitest } from "vitest";

import type { QB } from "./types";
import type Database from "~/kysely/types/Database";
import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { UsersId } from "~/kysely/types/public/Users";
import type { Equal, Expect } from "~/lib/types";
import ActionRunStatus from "~/kysely/types/public/ActionRunStatus";
import ApiAccessScope from "~/kysely/types/public/ApiAccessScope";
import ApiAccessType from "~/kysely/types/public/ApiAccessType";
import Event from "~/kysely/types/public/Event";
import { autoCache } from "./autoCache";
import { autoRevalidate } from "./autoRevalidate";
import { cachedFindTables } from "./sharedAuto";

const mockedDb = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: {
			connect: vitest.fn(),
			end: vitest.fn(),
		},
	}),
});

vitest.mock("./memoize", () => ({
	memoize: vitest.fn((fn) => fn),
}));

vitest.mock("react", () => ({
	cache: vitest.fn((fn) => fn),
}));

const compileAndFindTables = (qb: QB<any>, type: "select" | "mutation") => {
	return cachedFindTables(qb.compile(), type);
};

const qb = mockedDb.selectFrom("users").select(["id", "firstName"]);

describe("cachedFindTables", () => {
	it("should return the correct tables for a very simple select query", async () => {
		const tables = await compileAndFindTables(qb, "select");
		expect(tables).toEqual(["users"]);
	});

	it("should return the correct tables for a very simple mutation query", async () => {
		const qb = mockedDb
			.insertInto("users")
			.values({ firstName: "Croc", email: "croc@croc.com", slug: "croccroc" });

		const tables = await compileAndFindTables(qb, "mutation");
		expect(tables).toEqual(["users"]);
	});

	it("should not return the temporary table names in a CTE", async () => {
		const qb = mockedDb
			.with("temp", (qb) => qb.selectFrom("users").selectAll())
			.selectFrom("temp")
			.selectAll();

		const tables = await compileAndFindTables(qb, "select");
		expect(tables).toEqual(["users"]);
	});

	it("should return the correct tables for a query with a subquery", async () => {
		const qb = mockedDb
			.selectFrom("users")
			.select(["id", "firstName"])
			.where("id", "=", mockedDb.selectFrom("members").select("userId").limit(1));

		const tables = await compileAndFindTables(qb, "select");

		expect(tables).toEqual(["users", "members"]);
	});

	it("should return the correct tables for a query with a subquery in an array", async () => {
		const qb = mockedDb
			.selectFrom("users")
			.select(["id", "firstName"])
			.where("id", "=", [mockedDb.selectFrom("members").select("userId").limit(1)]);

		const tables = await compileAndFindTables(qb, "select");

		expect(tables).toEqual(["users", "members"]);
	});

	it("should not return the tables used in select subqueries/CTEs for mutation queries", async () => {
		const qb = mockedDb
			// users should not be included in the to be invalidated tags,
			// as it will not change
			.with("firstUser", (qb) => qb.selectFrom("users").selectAll().limit(1))
			// communities should not be included in the to be invalidated tags,
			// as it will not change
			.with("firstCommunity", (qb) => qb.selectFrom("communities").selectAll().limit(1))
			// members SHOULD be included in the to be invalidated tags
			.insertInto("members")
			.values((eb) => ({
				userId: eb.selectFrom("firstUser").select("firstUser.id"),
				communityId: eb.selectFrom("firstCommunity").select("firstCommunity.id"),
				canAdmin: true,
			}));

		const tables = await compileAndFindTables(qb, "mutation");

		expect(tables).toEqual(["members"]);
	});

	it("should not filter out the tables used in select subqueries/CTEs for mutation queries if they are also mutated", async () => {
		const qb = mockedDb
			.with("firstUser", (qb) => qb.selectFrom("users").selectAll().limit(1))
			.with("deletedUser", (qb) =>
				qb
					// users is mutated, so it should be included
					.deleteFrom("users")
					.where("id", "=", qb.selectFrom("firstUser").select("firstUser.id"))
			)
			.with("firstCommunity", (qb) => qb.selectFrom("communities").selectAll().limit(1))
			.insertInto("members")
			.values((eb) => ({
				userId: eb.selectFrom("firstUser").select("firstUser.id"),
				communityId: eb.selectFrom("firstCommunity").select("firstCommunity.id"),
				canAdmin: true,
			}));

		const tables = await compileAndFindTables(qb, "mutation");

		expect(tables).toEqual(["members", "users"]);
	});

	it("should return the correct tables for a rather complex query", async () => {
		const query = mockedDb.selectFrom("communities").select((eb) => [
			"communities.id",
			jsonArrayFrom(
				eb
					.selectFrom("pub_types")
					.select((eb) => [
						"pub_types.id",
						"pub_types.name",
						"pub_types.description",
						jsonArrayFrom(
							eb
								.selectFrom("pub_fields")
								.innerJoin("_PubFieldToPubType", "A", "pub_fields.id")
								.select((eb) => [
									"pub_fields.id",
									"pub_fields.name",
									"pub_fields.pubFieldSchemaId",
									"pub_fields.slug",
									"pub_fields.name",
									jsonObjectFrom(
										eb
											.selectFrom("PubFieldSchema")
											.select([
												"PubFieldSchema.id",
												"PubFieldSchema.namespace",
												"PubFieldSchema.name",
												"PubFieldSchema.schema",
											])
											.whereRef(
												"PubFieldSchema.id",
												"=",
												eb.ref("pub_fields.pubFieldSchemaId")
											)
									).as("schema"),
								])
								.where("_PubFieldToPubType.B", "=", eb.ref("pub_types.id"))
						).as("fields"),
					])
					.whereRef("pub_types.communityId", "=", eb.ref("communities.id"))
			).as("pubTypes"),
			jsonArrayFrom(
				eb
					.selectFrom("stages")
					.select(["stages.id", "stages.name", "stages.order"])
					.orderBy("stages.order desc")
			).as("stages"),
		]);

		const tables = await compileAndFindTables(query, "select");

		expect(tables).toEqual([
			"communities",
			"pub_types",
			"pub_fields",
			"_PubFieldToPubType",
			"PubFieldSchema",
			"stages",
		]);
	});

	it("should include joins in select queries", async () => {
		const query = mockedDb.selectFrom("members");

		const joins = [
			"innerJoin",
			"innerJoinLateral",
			"leftJoin",
			"leftJoinLateral",
			"rightJoin",
			"fullJoin",
		] as const;

		await Promise.all(
			joins.map(async (joinType) => {
				const tables = await compileAndFindTables(
					// @ts-expect-error shh
					query[joinType]("users", "users.id", "members.user_id"),
					"select"
				);
				return expect(tables).toEqual(["members", "users"]);
			})
		);
	});

	it("should not include joins in mutation queries", async () => {
		const query = mockedDb.insertInto("members").values((eb) => ({
			userId: eb
				.selectFrom("users")
				.innerJoin("members", "members.userId", "users.id")
				.innerJoin("communities", "communities.id", "members.communityId")
				.select("users.id"),
			communityId: eb.selectFrom("communities").select("communities.id"),
			canAdmin: true,
		}));

		const tables = await compileAndFindTables(query, "mutation");

		expect(tables).toEqual(["members"]);

		// function here to make sure the query is not executed
		() => {
			const revalidatedQuery = autoRevalidate(query);

			type CorrectQuery = Expect<Equal<(typeof revalidatedQuery)["qb"], typeof query>>;
			type CorrectExecuteResult = Expect<
				Equal<
					ReturnType<(typeof revalidatedQuery)["execute"]>,
					ReturnType<(typeof query)["execute"]>
				>
			>;
		};
	});

	it("should find the tables for a delete query", async () => {
		const query = mockedDb.deleteFrom("users").where("users.id", "=", "x" as UsersId);

		const tables = await compileAndFindTables(query, "mutation");

		expect(tables).toEqual(["users"]);

		() => {
			const revalidateQuery = autoRevalidate(query);

			type CorrectQuery = Expect<
				Equal<(typeof revalidateQuery)["execute"], (typeof query)["execute"]>
			>;

			const queryWithReturning = query.returning("id");
			const revalidateQueryWithReturning = autoRevalidate(queryWithReturning);

			type CorrectReturningQuery = Expect<
				Equal<
					(typeof revalidateQueryWithReturning)["execute"],
					(typeof queryWithReturning)["execute"]
				>
			>;
		};
	});

	it("should be able to handle null inserts", async () => {
		const query = mockedDb.insertInto("users").values({
			firstName: "Croc",
			email: "croc@crocy.com",
			slug: "croc",
			avatar: null,
		});
		const tables = await compileAndFindTables(query, "mutation");
		expect(tables).toEqual(["users"]);
	});

	it("should be able to handle conflicts", async () => {
		const query = mockedDb
			.with(
				"existingScheduledActionRun",
				(db) =>
					db
						.selectFrom("action_runs")
						.selectAll()
						.where("actionInstanceId", "=", "x" as ActionInstancesId)
						.where("pubId", "=", "x" as PubsId)
						.where("status", "=", ActionRunStatus.scheduled)
				// this should be guaranteed to be unique, as only one actionInstance should be scheduled per pub
			)
			.insertInto("action_runs")
			.values((eb) => ({
				id: eb.selectFrom("existingScheduledActionRun").select("id"),
				actionInstanceId: "id" as ActionInstancesId,
				pubId: "id" as PubsId,
				userId: null,
				status: ActionRunStatus.scheduled,
				result: {},
				config: eb
					.selectFrom("action_instances")
					.select("config")
					.where("action_instances.id", "=", "id" as ActionInstancesId),
				params: {},
				event: Event.pubInStageForDuration,
			}))
			// conflict should only happen if a scheduled action is excecuted
			// not on user initiated actions or on other events
			.onConflict((oc) =>
				oc.column("id").doUpdateSet({
					result: {},
					params: {},
					event: Event.pubInStageForDuration,
					status: ActionRunStatus.failure,
				})
			);

		const tables = await compileAndFindTables(query, "mutation");

		expect(tables).toEqual(["action_runs"]);

		() => {
			const revalidateQuery = autoRevalidate(query);

			type CorrectQuery = Expect<
				Equal<(typeof revalidateQuery)["execute"], (typeof query)["execute"]>
			>;
		};
	});

	it("should handle complex unions", async () => {
		const query = mockedDb
			.with("combined_results", (db) =>
				db
					.selectFrom("pub_fields")
					.distinctOn("pub_fields.id")
					.innerJoin("pub_values", "pub_values.fieldId", "pub_fields.id")
					.innerJoin("pubs", "pubs.id", "pub_values.pubId")
					.where("pubs.communityId", "=", "x" as CommunitiesId)
					.select([
						"pub_fields.id",
						"pub_fields.name",
						"pub_fields.pubFieldSchemaId",
						"pub_fields.slug",
					])

					.unionAll(
						db
							.selectFrom("pub_fields")
							.distinctOn("pub_fields.id")
							.innerJoin(
								"_PubFieldToPubType",
								"pub_fields.id",
								"_PubFieldToPubType.A"
							)
							.innerJoin("pub_types", "pub_types.id", "_PubFieldToPubType.B")
							.innerJoin("communities", "communities.id", "pub_types.communityId")
							.where("communities.id", "=", "x" as CommunitiesId)
							.select([
								"pub_fields.id",
								"pub_fields.name",
								"pub_fields.pubFieldSchemaId",
								"pub_fields.slug",
							])
					)
			)
			.selectFrom("combined_results")
			.select([
				"combined_results.id",
				"combined_results.name",
				"combined_results.pubFieldSchemaId",
				"combined_results.slug",
			])
			.distinct();

		const tables = await compileAndFindTables(query, "select");

		expect(tables).toEqual([
			"pub_fields",
			"pub_values",
			"pubs",
			"_PubFieldToPubType",
			"pub_types",
			"communities",
		]);

		() => {
			const cachedQuery = autoCache(query);

			type CorrectQuery = Expect<
				Equal<(typeof cachedQuery)["execute"], (typeof query)["execute"]>
			>;
		};
	});

	it("should handle a mutation CTE with a selct query at the end", async () => {
		const query = mockedDb
			.with("new_token", (db) =>
				db
					.insertInto("api_access_tokens")
					.values({
						token: "token",
						communityId: "id" as CommunitiesId,
						name: "name",
						description: "description",
						expiration: new Date(),
						issuedById: "id" as UsersId,
					})
					.returning(["id", "token"])
			)
			.with("new_permissions", (db) =>
				db.insertInto("api_access_permissions").values((eb) => ({
					apiAccessTokenId: eb.selectFrom("new_token").select("new_token.id"),
					scope: ApiAccessScope.pub,
					accessType: ApiAccessType.read,
					constraints: null,
				}))
			)
			.selectFrom("api_access_logs")
			.selectAll()
			.where(({ eb, exists }) =>
				exists(
					eb
						.selectFrom("new_token")
						.select("new_token.id")
						.whereRef("new_token.id", "=", "api_access_logs.accessTokenId")
				)
			);

		const tables = await compileAndFindTables(query, "mutation");

		expect(tables).toEqual(["api_access_tokens", "api_access_permissions"]);

		() => {
			const revalidateQuery = autoRevalidate(query);

			type CorrectQuery = Expect<
				Equal<(typeof revalidateQuery)["execute"], (typeof query)["execute"]>
			>;
		};
	});
});
