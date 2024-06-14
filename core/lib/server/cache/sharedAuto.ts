import type { CompiledQuery, OperationNode, Simplify } from "kysely";

import { TableNode } from "kysely";

import type {
	AutoCacheOptions,
	CallbackAutoOutput,
	DirectAutoOutput,
	ExecuteCreatorFn,
	ExecuteFnFromQueryBuilderFunction,
	QB,
	QueryBuilderFromQueryBuilderFunction,
	QueryBuilderFunction,
} from "./types";
import type Database from "~/kysely/types/Database";

export function findTables<T extends OperationNode>(
	node: T | T[],
	tables = new Set<keyof Database>()
): Set<keyof Database> {
	// console.log({ node });
	if (Array.isArray(node)) {
		for (const item of node) {
			findTables(item, tables);
		}
		return tables;
	}

	if (typeof node !== "object") {
		return tables;
	}

	if (TableNode.is(node)) {
		tables.add(node.table.identifier.name);
		return tables;
	}

	for (const [key, value] of Object.entries(node)) {
		if (typeof value !== "object") {
			continue;
		}

		if (TableNode.is(value)) {
			// TODO: do a runtime check to see if the table exists
			tables.add(value.table.identifier.name);
			continue;
		}

		findTables(value, tables);
	}

	return tables;
}

export const cachedFindTables = // memoize(
	async <T extends CompiledQuery<Simplify<any>>>(query: T) => {
		const tables = findTables(query.query);
		return Array.from(tables ?? []);
	};
//     ,
// 	{
// 		additionalCacheKey: (query) => [query.sql],
// 		duration: 60 * 60,
// 	}
// );

/**
 * For when using
 *
 * ```ts
 * autoCache(db.selectFrom("...").select("*"));
 * ```
 *
 * Rather than the callback version, e.g.
 *
 * ```ts
 * autoCache((userId) => db.selectFrom("...").where("id", "=", userId));
 * ```
 */
export const directAutoOutput = <Q extends QB>(
	qb: Q,
	executeCreatorFn: ExecuteCreatorFn<
		Q,
		"execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"
	>,
	options?: AutoCacheOptions
) => {
	return {
		qb,
		execute: executeCreatorFn(qb, "execute", options),
		executeTakeFirst: executeCreatorFn(qb, "executeTakeFirst", options),
		executeTakeFirstOrThrow: executeCreatorFn(qb, "executeTakeFirstOrThrow", options),
	} satisfies DirectAutoOutput<Q>;
};

export const callbackExecute = <
	QBF extends QueryBuilderFunction<any, any>,
	M extends "execute" | "executeTakeFirst" | "executeTakeFirstOrThrow",
	ECF extends ExecuteCreatorFn<QueryBuilderFromQueryBuilderFunction<QBF>, M>,
>(
	queryFn: QBF,
	method: M,
	executeCreatorFn: ECF,
	options?: AutoCacheOptions
) => {
	const callbackExecuteFn = async (...args: Parameters<QBF>) => {
		const { qb } = await queryFn(...args);

		const executeFn = executeCreatorFn(qb, method, options);

		const result = await executeFn();

		return result;
	};

	return callbackExecuteFn as ExecuteFnFromQueryBuilderFunction<QBF, M>;
};

/**
 * For when using
 *
 * ```ts
 * autoCache((userId) => db.selectFrom("...").where("id", "=", userId));
 * ```
 *
 * Rather than the direct version, e.g.
 *
 * ```ts
 * autoCache(db.selectFrom("...").select("*"));
 * ```
 */
export const callbackAutoOutput = <Q extends QB, P extends any[]>(
	queryFn: QueryBuilderFunction<Q, P>,
	executeCreatorFn: ExecuteCreatorFn<
		Q,
		"execute" | "executeTakeFirst" | "executeTakeFirstOrThrow"
	>,
	options?: AutoCacheOptions
) => {
	return {
		getQb: queryFn,
		execute: callbackExecute(queryFn, "execute", executeCreatorFn, options),
		executeTakeFirst: callbackExecute(queryFn, "executeTakeFirst", executeCreatorFn, options),
		executeTakeFirstOrThrow: callbackExecute(
			queryFn,
			"executeTakeFirstOrThrow",
			executeCreatorFn,
			options
		),
	} satisfies CallbackAutoOutput<typeof queryFn>;
};
