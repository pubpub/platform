import type { ExpressionBuilder, ExpressionWrapper } from "kysely";

import { sql } from "kysely";

import type {
	BaseFilter,
	FieldLevelFilter,
	Filter,
	FilterOperator,
	LogicalFilter,
	LogicalOperator,
} from "contracts";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";
import { assert } from "utils";

import { entries, fromEntries, keys, mapToEntries } from "../mapping";

type EntriedLogicalFilter = [
	["$or", NonNullable<LogicalFilter["$or"]>],
	["$and", NonNullable<LogicalFilter["$and"]>],
	["$not", NonNullable<LogicalFilter["$not"]>],
][number];

type EntriedFilter = [string, FieldLevelFilter[keyof FieldLevelFilter]] | EntriedLogicalFilter;

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
	$in: (eb, column, value) =>
		eb(column, "in", typeof value === "string" ? JSON.stringify(value) : value),
	$notIn: (eb, column, value) =>
		eb(column, "not in", typeof value === "string" ? JSON.stringify(value) : value),
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

export const isNonRecursiveFilter = (filter: FieldLevelFilter[string]): filter is BaseFilter => {
	// Check if this is a logical operator within a field filter
	if (filter && typeof filter === "object" && !Array.isArray(filter)) {
		const ks = keys(filter);
		if (ks.some((k) => logicalOperators.includes(k as LogicalOperator))) {
			return false;
		}
	}

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
	const conditions = entries(filters).map((filter) => {
		// Handle top-level logical operators
		if (isLogicalFilter(filter)) {
			const operatorFilter = mapToEntries(filter, ["operator", "filters"]);

			return applyLogicalOperation(eb, operatorFilter);
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

		// Handle field-level logical operators
		if (!isNonRecursiveFilter(val)) {
			const logicalOps = entries(val).filter(([key]) => logicalOperators.includes(key));

			if (logicalOps.length === 0) {
				throw new Error(`Unknown filter: ${JSON.stringify(filter)}`);
			}

			const [operator, subFilters] = logicalOps[0];

			// For field-level operators, we need to apply the field constraint to each subfilter
			if (operator === "$not") {
				// Special case for $not since it takes a single filter, not an array
				const newFilter = { [field]: subFilters };
				return eb.not(applyFilters(eb, newFilter));
			} else {
				// For $or and $and, map each subfilter to include the field
				const fieldConstrainedFilters = subFilters.map((subFilter) => ({
					[field]: subFilter,
				}));
				return applyLogicalOperation(eb, { operator, filters: fieldConstrainedFilters });
			}
		}

		// Handle regular field filters
		return eb.and([
			...(isDate ? [] : [eb("slug", "=", field)]),
			...entries(val).map((entry) => {
				const [operator, value] = entry;

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
	});

	return eb.and(conditions) as ExpressionWrapped<K>;
}

// Helper function to apply logical operations
function applyLogicalOperation<K extends ExpressionBuilder<any, any>>(
	eb: K,
	operatorFilters:
		| { operator: Exclude<LogicalOperator, "$not">; filters: Filter[] }
		| { operator: "$not"; filters: Filter }
): ExpressionWrapper<any, any, any> {
	switch (operatorFilters.operator) {
		case "$or":
			return eb.or(operatorFilters.filters.map((f) => applyFilters(eb, f)));
		case "$and":
			return eb.and(operatorFilters.filters.map((f) => applyFilters(eb, f)));
		case "$not":
			// $not should only have one filter
			return eb.not(applyFilters(eb, operatorFilters.filters));
		default:
			throw new Error(`Unknown logical operator: ${operatorFilters}`);
	}
}
