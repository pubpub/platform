import type {
	DeleteQueryBuilder,
	InferResult,
	InsertQueryBuilder,
	QueryResult,
	UpdateQueryBuilder,
} from "kysely";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import type Database from "~/kysely/types/Database";
import { db } from "~/kysely/database";
import { createCacheTag } from "./cacheTags";

export const revalidate = async <
	T extends
		| InsertQueryBuilder<Database, keyof Database, any>
		| UpdateQueryBuilder<Database, keyof Database, keyof Database, any>
		| DeleteQueryBuilder<Database, keyof Database, any>,
>(
	mutation: T,
	communityId:
		| string
		| ((result: QueryResult<InferResult<typeof mutation>>["rows"][number]) => string),
	extra?: { tags?: string[] }
) => {
	const c = cookies().get("communityId");

	const compiledQuery = mutation.compile();

	const table = new Set(
		Array.from(compiledQuery.sql.matchAll(/(insert into|delete from|update) "(\w+)"/g)).map(
			([, , table]) => table
		)
	);

	const result = (await db.executeQuery(compiledQuery)) as QueryResult<
		InferResult<typeof mutation>
	>;

	const cId = typeof communityId === "function" ? communityId(result.rows[0]) : communityId;

	Array.from(table).forEach((table) => {
		revalidateTag(createCacheTag(table, cId));
	});
	return result;
};

revalidate(
	db.updateTable("pubs").set({ valuesBlob: "s" }).returning("community_id"),
	(result) => result[0].community_id
);
