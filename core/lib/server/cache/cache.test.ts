import { describe } from "node:test";

import { Kysely, PostgresDialect } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";
import { expect, it, vitest } from "vitest";

import type { QB } from "./types";
import type Database from "~/kysely/types/Database";
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
			.where("id", "=", mockedDb.selectFrom("members").select("user_id").limit(1));

		const tables = await compileAndFindTables(qb, "select");

		expect(tables).toEqual(["users", "members"]);
	});

	it("should return the correct tables for a query with a subquery in an array", async () => {
		const qb = mockedDb
			.selectFrom("users")
			.select(["id", "firstName"])
			.where("id", "=", [mockedDb.selectFrom("members").select("user_id").limit(1)]);

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
				user_id: eb.selectFrom("firstUser").select("firstUser.id"),
				community_id: eb.selectFrom("firstCommunity").select("firstCommunity.id"),
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
				user_id: eb.selectFrom("firstUser").select("firstUser.id"),
				community_id: eb.selectFrom("firstCommunity").select("firstCommunity.id"),
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
					.whereRef("pub_types.community_id", "=", eb.ref("communities.id"))
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
			user_id: eb
				.selectFrom("users")
				.innerJoin("members", "members.user_id", "users.id")
				.innerJoin("communities", "communities.id", "members.community_id")
				.select("users.id"),
			community_id: eb.selectFrom("communities").select("communities.id"),
			canAdmin: true,
		}));

		const tables = await compileAndFindTables(query, "mutation");

		expect(tables).toEqual(["members"]);
	});
});
