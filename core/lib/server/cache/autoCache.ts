import type { InferResult, OperationNode, QueryResult, SelectQueryBuilder } from "kysely";

import { TableNode } from "kysely";

import type Database from "~/kysely/types/Database";
import type { CommunitiesId } from "~/kysely/types/public/Communities";
import { db } from "~/kysely/database";
import { createCacheTag, ValidTag } from "./cacheTags";
import { memoize, MemoizeOptionType } from "./memoize";

const findTablesRaw = (sql: string) =>
	Array.from(sql.matchAll(/from\s+"(\w+)"/gi)).map((m) => m[2]);

export function findTables<T extends OperationNode>(
	node: T | T[],
	tables = new Set<string>()
): Set<string> {
	if (Array.isArray(node)) {
		for (const item of node) {
			findTables(item, tables);
		}
		return tables;
	}

	if (typeof node !== "object") {
		return tables;
	}

	for (const [key, value] of Object.entries(node)) {
		if (typeof value !== "object") {
			continue;
		}

		if (TableNode.is(value)) {
			tables.add(value.table.identifier.name);
			continue;
		}

		findTables(value, tables);
	}

	return tables;
}

export const autoCache = async <T extends SelectQueryBuilder<Database, keyof Database, any>>(
	query: T,
	communityId: CommunitiesId, //| ((result: Awaited<Result>) => string),
	options?: Omit<MemoizeOptionType<any[]>, "revalidateTags" | "additionalCacheKey"> & {
		revalidateTags?: ValidTag[];
		additionalCacheKey?: string[];
	}
) => {
	const compiledQuery = query.compile();

	const tables = Array.from(findTables(compiledQuery.query));

	const res = memoize(
		() =>
			db.executeQuery(compiledQuery) as Promise<
				QueryResult<InferResult<typeof query>[number]>
			>,
		{
			...options,
			revalidateTags: [
				...tables.map((table) => createCacheTag(table, communityId)),
				...(options?.revalidateTags ?? []),
			],
			additionalCacheKey: [
				...(compiledQuery.parameters as string[]),
				...(options?.additionalCacheKey ?? []),
				compiledQuery.sql,
			],
		}
	);

	return (await res()).rows;
};
