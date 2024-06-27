import type { CompiledQuery, OperationNode, Simplify } from "kysely";

import { SelectQueryNode, TableNode } from "kysely";

import type {
	AutoCacheOptions,
	AutoOptions,
	AutoRevalidateOptions,
	DirectAutoOutput,
	ExecuteCreatorFn,
	QB,
} from "./types";
import type Database from "~/kysely/types/Database";
import { databaseTables } from "~/kysely/table-names";

export function findTables<T extends OperationNode>(
	node: T | T[],
	type: "select" | "mutation",
	tables = new Set<string>()
): Set<string> {
	if (Array.isArray(node)) {
		for (const item of node) {
			findTables(item, type, tables);
		}
		return tables;
	}

	if (typeof node !== "object" || node === null || node === undefined) {
		return tables;
	}

	// we do not want to invalidate the cache for select queries made
	// during mutations, as they are not (per se) affected by the mutation
	if (type === "mutation" && SelectQueryNode.is(node)) {
		// the only situation in which a SelectQueryBuilder
		// is passed to autoRevalidate is when it is a mutating
		// CTE where you want to return the result of the CTE
		// in the same query, like this:
		// db.with('cte', db => db.insertInto('x')
		// .returningAll()...).selectFrom('cte').selectAll()
		if (node.with) {
			findTables(node.with, type, tables);
		}

		return tables;
	}

	if (TableNode.is(node)) {
		tables.add(node.table.identifier.name);
		return tables;
	}

	for (const [key, value] of Object.entries(node)) {
		if (typeof value !== "object" || value === null || value === undefined) {
			continue;
		}

		if (TableNode.is(value)) {
			// TODO: do a runtime check to see if the table exists
			tables.add(value.table.identifier.name);
			continue;
		}

		findTables(value, type, tables);
	}

	return tables;
}

export const cachedFindTables = async <T extends CompiledQuery<Simplify<any>>>(
	query: T,
	type: "select" | "mutation"
): Promise<(keyof Database)[]> => {
	const getTables = async () => findTables(query.query, type);
	// TODO: benchmark whether memoization is worth it

	// const getTables = memoize(() => findTables(query.query, type), {
	// 	additionalCacheKey: [query.sql],
	// 	// since this is just a computation of the tables from a query,
	// 	// we don't really need to revalidate it
	// 	duration: ONE_DAY,
	// });

	const tables = await getTables();
	const tableArray = Array.from(tables ?? []);

	const filteredTables = tableArray.filter((table): table is (typeof databaseTables)[number] =>
		databaseTables.some((dbTable) => dbTable === table)
	);

	return filteredTables;
};

export const directAutoOutput = <Q extends QB<any>>(
	qb: Q,
	executeCreatorFn: ExecuteCreatorFn<
		Q,
		"execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"
	>,
	options?: AutoOptions<Q>
) => {
	return {
		qb,
		execute: executeCreatorFn(qb, "execute", options),
		executeTakeFirst: executeCreatorFn(qb, "executeTakeFirst", options),
		executeTakeFirstOrThrow: executeCreatorFn(qb, "executeTakeFirstOrThrow", options),
	} satisfies DirectAutoOutput<Q>;
};
