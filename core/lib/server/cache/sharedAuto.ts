import type { CompiledQuery, OperationNode, Simplify } from "kysely";

import { QueryNode, SelectQueryNode, TableNode } from "kysely";

import type { Database } from "db/Database";
import { databaseTableNames } from "db/table-names";

import type { AutoOptions, DirectAutoOutput, ExecuteCreatorFn, QB } from "./types";

export function findTables<T extends OperationNode>(
	node: T | T[],
	type: "select" | "mutation",
	tables = new Set<string>(),
	operations = new Set<QueryNode["kind"]>()
): { tables: Set<string>; operations: Set<QueryNode["kind"]> } {
	if (Array.isArray(node)) {
		for (const item of node) {
			findTables(item, type, tables, operations);
		}
		return { tables, operations };
	}

	if (typeof node !== "object" || node === null || node === undefined) {
		return { tables, operations };
	}

	if (QueryNode.is(node)) {
		operations.add(node.kind);
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
			findTables(node.with, type, tables, operations);
		}

		return { tables, operations };
	}

	if (TableNode.is(node)) {
		tables.add(node.table.identifier.name);
		return { tables, operations };
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

		findTables(value, type, tables, operations);
	}

	return { tables, operations };
}

export class AutoRevalidateWithoutMutationError extends Error {
	message =
		"Invalid use of `autoRevalidate`: it is not possible to use `autoRevalidate` without using either an `insertInto`, `deleteFrom`, or `updateTable` query. Did you mean to use `autoCache`?";
}

export class AutoCacheWithMutationError extends Error {
	constructor(queries: Set<QueryNode["kind"]>) {
		super();
		const offendingQueries = Array.from(queries)
			.filter((query) => query !== "SelectQueryNode")
			.map((query) => query.replace("QueryNode", ""))
			.join(", ");

		this.message = `Invalid usage of '${offendingQueries}' within \`autoCache\`: it is not possible to use \`autoCache\` with a query that contains \`insertInto\`, \`deleteFrom\`, or \`updateTable\`. Either split up the query, or use \`autoRevalidate\` instead.`;
	}
}

export const cachedFindTables = <T extends CompiledQuery<Simplify<any>>>(
	query: T,
	type: "select" | "mutation"
): (keyof Database)[] => {
	// TODO: benchmark whether memoization is worth it

	// const getTables = memoize(() => findTables(query.query, type), {
	// 	additionalCacheKey: [query.sql],
	// 	// since this is just a computation of the tables from a query,
	// 	// we don't really need to revalidate it
	// 	duration: ONE_DAY,
	// });

	const { tables, operations } = findTables(query.query, type);

	/**
	 * basically, you should not be able to `autoRevalidate` select queries
	 *
	 * ```ts
	 * autoRevalidate(db.selectFrom('pubs').selectAll())
	 * ```
	 *
	 * or cache mutation queries
	 *
	 * ```ts
	 * autoCache(db.with('new_pub', db=>db
	 *		.insertInto('pubs')
	 *		.values({ //...
	 *		})
	 *		.returningAll()
	 *    )
	 *	.selectFrom('new_pub')
	 *	.selectAll()
	 * )
	 * ```
	 *
	 * Typescript will allow either of these, so we catch them at runtime instead. I also added tests to make sure these kinds of usages do throw
	 */
	if (type === "mutation" && operations.has("SelectQueryNode") && operations.size === 1) {
		throw new AutoRevalidateWithoutMutationError();
	}

	if (type === "select" && operations.size > 1) {
		throw new AutoCacheWithMutationError(operations);
	}

	const tableArray = Array.from(tables ?? []);

	const filteredTables = tableArray.filter(
		(table): table is (typeof databaseTableNames)[number] =>
			databaseTableNames.some((dbTable) => dbTable === table)
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
