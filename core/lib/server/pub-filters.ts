import type { ExpressionBuilder, ExpressionWrapper } from "kysely";

import { sql } from "kysely";

import type { BaseFilter, Filter, FilterOperator, LogicalFilter, LogicalOperator } from "contracts";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";
import { assert } from "utils";

type PathSegment = string; // Regular property

type Path = PathSegment[];

// Helper type to get the type of a value at a specific path

type EntriedLogicalFilter = [
	["$or", NonNullable<LogicalFilter["$or"]>],
	["$and", NonNullable<LogicalFilter["$and"]>],
	["$not", NonNullable<LogicalFilter["$not"]>],
][number];
type EntriedArrayFilter = [["$any", Filter], ["$all", Filter]];

type EntriedFilter = [string, BaseFilter[keyof BaseFilter]] | EntriedLogicalFilter;

const isLogicalFilter = (filter: EntriedFilter): filter is EntriedLogicalFilter => {
	return (
		typeof filter === "object" &&
		filter !== null &&
		logicalOperators.includes(filter[0] as LogicalOperator)
	);
};

export const stringOperators = [
	"$eq",
	"$eqi",
	"$ne",
	"$nei",
	"$contains",
	"$notContains",
	"$containsi",
	"$notContainsi",
	"$startsWith",
	"$startsWithi",
	"$endsWith",
	"$endsWithi",
	"$null",
	"$notNull",
] as const satisfies FilterOperator[];

export const coreSchemaTypeAllowedOperators = {
	[CoreSchemaType.Boolean]: ["$eq", "$ne", "$null", "$notNull"],
	[CoreSchemaType.String]: stringOperators,
	[CoreSchemaType.Number]: [
		"$eq",
		"$ne",
		"$lt",
		"$lte",
		"$gt",
		"$gte",
		"$between",
		"$null",
		"$notNull",
	],
	[CoreSchemaType.Vector3]: ["$eq", "$ne", "$null", "$notNull", "$jsonPath"],
	[CoreSchemaType.NumericArray]: ["$contains", "$notContains", "$null", "$notNull", "$jsonPath"],
	[CoreSchemaType.StringArray]: ["$contains", "$notContains", "$null", "$notNull", "$jsonPath"],
	[CoreSchemaType.DateTime]: [
		"$eq",
		"$ne",
		"$lt",
		"$lte",
		"$gt",
		"$gte",
		"$between",
		"$null",
		"$notNull",
	],
	[CoreSchemaType.Email]: stringOperators,
	[CoreSchemaType.URL]: stringOperators,
	[CoreSchemaType.MemberId]: ["$eq", "$ne", "$null", "$notNull", "$in", "$notIn"],
	[CoreSchemaType.FileUpload]: ["$null", "$notNull", "$jsonPath"],
	[CoreSchemaType.RichText]: [
		"$eq",
		"$ne",
		"$contains",
		"$notContains",
		"$containsi",
		"$notContainsi",
		"$startsWith",
		"$startsWithi",
		"$endsWith",
		"$endsWithi",
		"$null",
		"$notNull",
	],
	[CoreSchemaType.Null]: ["$null"],
} as const satisfies Record<CoreSchemaType, FilterOperator[]>;

const filterMap = {
	$eq: (eb, column, value) => eb(column, "=", JSON.stringify(value)),
	$eqi: (eb, column, value) =>
		eb(sql.raw(`lower(${column}::text)`), "=", JSON.stringify(String(value).toLowerCase())),
	$ne: (eb, column, value) => eb(column, "!=", JSON.stringify(value)),
	$nei: (eb, column, value) =>
		eb(sql.raw(`lower(${column}::text)`), "!=", JSON.stringify(String(value).toLowerCase())),
	$null: (eb, column, value) => eb(column, "is", null),
	$notNull: (eb, column, value) => eb(column, "is not", null),
	$lt: (eb, column, value) =>
		eb(column, "<", typeof value === "string" ? JSON.stringify(value) : value),
	$lte: (eb, column, value) =>
		eb(column, "<=", typeof value === "string" ? JSON.stringify(value) : value),
	$gt: (eb, column, value) =>
		eb(column, ">", typeof value === "string" ? JSON.stringify(value) : value),
	$gte: (eb, column, value) =>
		eb(column, ">=", typeof value === "string" ? JSON.stringify(value) : value),
	$between: (eb, column, value) => {
		assert(Array.isArray(value));
		return eb.and([
			eb(column, ">=", typeof value[0] === "string" ? JSON.stringify(value[0]) : value[0]),
			eb(column, "<=", typeof value[1] === "string" ? JSON.stringify(value[1]) : value[1]),
		]);
	},
	$in: (eb, column, value) => eb(column, "in", value),
	$notIn: (eb, column, value) => eb(column, "not in", value),
	$contains: (eb, column, value) => eb(sql.raw(`${column}::text`), "like", `%${String(value)}%`),
	$notContains: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "not like", `%${String(value)}%`),
	$containsi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "ilike", `%${String(value).toLowerCase()}%`),
	$notContainsi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "not ilike", `%${String(value).toLowerCase()}%`),
	$startsWith: (eb, column, value) => eb(column, "like", `${String(value)}%`),
	$startsWithi: (eb, column, value) => eb(column, "ilike", `${String(value).toLowerCase()}%`),
	$endsWith: (eb, column, value) => eb(column, "like", `%${String(value)}`),
	$endsWithi: (eb, column, value) => eb(column, "ilike", `%${String(value).toLowerCase()}`),
	$jsonPath: (eb, column, value) => {
		assert(typeof value === "string");
		return eb("value", "@@", value);
	},
} as const satisfies Record<
	FilterOperator,
	(
		eb: ExpressionBuilder<any, any>,
		column: "value" | "pubs.updatedAt" | "pubs.createdAt",
		value: unknown,
		carriedOperator?: "any" | "all"
	) => ExpressionWrapper<any, any, any>
>;

export const isNonRecursiveFilter = (
	filter: BaseFilter[string]
): filter is Exclude<BaseFilter[string], Filter> => {
	if (Object.keys(filter).every((k) => k.startsWith("$"))) {
		return true;
	}
	return false;
};

export type FieldsWithFilters = {
	[slug: string]: Set<FilterOperator>;
};

type ExpressionWrapped<E extends ExpressionBuilder<any, any>> =
	E extends ExpressionBuilder<infer T, infer U> ? ExpressionWrapper<T, U, any> : never;
export function applyFilters<K extends ExpressionBuilder<any, any>>(
	eb: K,
	filters: Filter
): ExpressionWrapped<K> {
	const conditions = Object.entries(filters).map((filter: EntriedFilter) => {
		if (isLogicalFilter(filter)) {
			if (filter[0] === "$or") {
				return eb.or(filter[1].map((f) => applyFilters(eb, f)));
			}
			if (filter[0] === "$and") {
				return eb.and(filter[1].map((f) => applyFilters(eb, f)));
			}
			if (filter[0] === "$not") {
				return eb.not(applyFilters(eb, filter[1]));
			}

			throw new Error(`Unknown logical operator: ${filter[0]}`);
		}

		const [field, val] = filter;

		const isDate = field === "updatedAt" || field === "createdAt";
		if (
			isDate &&
			!new Set(Object.keys(val)).isSubsetOf(
				new Set(coreSchemaTypeAllowedOperators[CoreSchemaType.DateTime])
			)
		) {
			throw new Error(`Date filters must use date operators: ${JSON.stringify(val)}`);
		}

		if (!isNonRecursiveFilter(val)) {
			throw new Error(`Unknown filter: ${JSON.stringify(filter)}`);
		}

		return eb.and([
			...(isDate ? [] : [eb("slug", "=", field)]),
			...Object.entries(val).map((entry) => {
				const [operator, value] = entry as [FilterOperator, unknown];

				const whereFn = filterMap[operator];
				if (!whereFn) {
					throw new Error(`Unknown operator: ${operator}`);
				}

				const maybeStringifiedValue = (value: unknown): unknown => {
					if (Array.isArray(value)) {
						return value.map((v) => maybeStringifiedValue(v));
					}

					if (value instanceof Date) {
						return value.toISOString();
					}

					return value;
				};

				return whereFn(
					eb,
					isDate ? `pubs.${field}` : "value",
					maybeStringifiedValue(value)
				);
			}),
		]);

		// const validOperators = getValidOperatorsForSchema(getJsonSchemaByCoreSchemaType(field));
		// // naive check

		// if (!validOperators.includes(operator)) {
		//     throw new Error(`Operator ${operator} is not valid for schema type ${field}`);
		// }
	});

	return eb.and(conditions) as ExpressionWrapped<K>;
}
