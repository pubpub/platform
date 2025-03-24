import type { ExpressionBuilder, ExpressionWrapper } from "kysely";

import { sql } from "kysely";

import type {
	FieldLevelFilter,
	FieldLevelLogicalFilter,
	Filter,
	FilterOperator,
	LogicalOperator,
	TopLevelLogicalFilter,
} from "contracts";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";
import { assert } from "utils";

import { entries } from "../mapping";

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
	"$in",
	"$notIn",
	"$exists",
] as const satisfies FilterOperator[];

export const coreSchemaTypeAllowedOperators = {
	[CoreSchemaType.Boolean]: ["$eq", "$ne", "$null", "$notNull", "$exists"],
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
		"$in",
		"$notIn",
		"$exists",
	],
	[CoreSchemaType.Vector3]: ["$eq", "$ne", "$null", "$notNull", "$jsonPath", "$exists"],
	[CoreSchemaType.NumericArray]: [
		"$contains",
		"$notContains",
		"$null",
		"$notNull",
		"$jsonPath",
		"$exists",
	],
	[CoreSchemaType.StringArray]: [
		"$contains",
		"$notContains",
		"$null",
		"$notNull",
		"$jsonPath",
		"$exists",
	],
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
		"$in",
		"$notIn",
		"$exists",
	],
	[CoreSchemaType.Email]: stringOperators,
	[CoreSchemaType.URL]: stringOperators,
	[CoreSchemaType.MemberId]: ["$eq", "$ne", "$null", "$notNull", "$in", "$notIn", "$exists"],
	[CoreSchemaType.FileUpload]: ["$null", "$notNull", "$jsonPath", "$exists"],
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
		"$exists",
	],
	[CoreSchemaType.Null]: ["$null", "$exists"],
} as const satisfies Record<CoreSchemaType, FilterOperator[]>;

const filterMap = {
	$eq: (eb, column, value) =>
		eb(column, "=", typeof value === "string" ? JSON.stringify(value) : value),
	$eqi: (eb, column, value) =>
		eb(sql.raw(`lower(${column}::text)`), "=", JSON.stringify(String(value).toLowerCase())),
	$ne: (eb, column, value) =>
		eb(column, "!=", typeof value === "string" ? JSON.stringify(value) : value),
	$nei: (eb, column, value) =>
		eb(sql.raw(`lower(${column}::text)`), "!=", JSON.stringify(String(value).toLowerCase())),
	$null: (eb, column, value) => eb(column, "is", null),
	$notNull: (eb, column, value) => eb(column, "is not", null),
	$exists: (eb, column, value) => eb.lit(true),
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
		eb(
			column,
			"in",
			typeof value === "string"
				? JSON.stringify(value)
				: Array.isArray(value)
					? value.map((val) => (typeof val === "string" ? JSON.stringify(val) : val))
					: value
		),
	$notIn: (eb, column, value) =>
		eb(column, "not in", typeof value === "string" ? JSON.stringify(value) : value),
	$contains: (eb, column, value) => eb(sql.raw(`${column}::text`), "like", `%${String(value)}%`),
	$notContains: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "not like", `%${String(value)}%`),
	$containsi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "ilike", `%${String(value).toLowerCase()}%`),
	$notContainsi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "not ilike", `%${String(value).toLowerCase()}%`),
	$startsWith: (eb, column, value) => eb(sql.raw(`${column}::text`), "like", `${String(value)}%`),
	$startsWithi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "ilike", `${String(value).toLowerCase()}%`),
	$endsWith: (eb, column, value) => eb(sql.raw(`${column}::text`), "like", `%${String(value)}`),
	$endsWithi: (eb, column, value) =>
		eb(sql.raw(`${column}::text`), "ilike", `%${String(value).toLowerCase()}`),
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

/**
 * Helper function to stringify values as needed
 */
const maybeStringifiedValue = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map((v) => maybeStringifiedValue(v));
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	return value;
};
type EntriedFieldLevelLogicalOperator = {
	[K in keyof FieldLevelLogicalFilter]-?: [K, NonNullable<FieldLevelLogicalFilter[K]>];
}[keyof FieldLevelLogicalFilter];

type EntriedTopLevelLogicalFilter = [
	["$or", NonNullable<TopLevelLogicalFilter["$or"]>],
	["$and", NonNullable<TopLevelLogicalFilter["$and"]>],
	["$not", NonNullable<TopLevelLogicalFilter["$not"]>],
][number];

type EntriedFilter = [string, FieldLevelFilter] | EntriedTopLevelLogicalFilter;

type EntriedFieldLevelFilter = [FilterOperator, unknown] | EntriedFieldLevelLogicalOperator;

export const isTopLevelEntriedLogicalFilter = (
	filter: EntriedFilter
): filter is EntriedTopLevelLogicalFilter => {
	return logicalOperators.includes(filter[0] as LogicalOperator);
};

/**
 * checks if an object is a field-level logical operator
 */
export const isFieldLevelEntriedLogicalOperator = (
	obj: EntriedFieldLevelFilter
): obj is EntriedFieldLevelLogicalOperator => {
	return logicalOperators.includes(obj[0] as LogicalOperator);
};

/**
 * apply field level filters
 */
export const applyFieldLevelFilters = <K extends ExpressionBuilder<any, any>>(
	eb: K,
	fieldLevelFilter: FieldLevelFilter,
	column: "value" | "pubs.updatedAt" | "pubs.createdAt"
): ExpressionWrapper<any, any, any> => {
	return eb.and(
		entries(fieldLevelFilter).map((condition) => {
			if (isFieldLevelEntriedLogicalOperator(condition)) {
				const [op, conditions] = condition;

				// return applyLogicalOperator(eb, op, conditions, (eb, condition) =>
				// 	applyFieldLevelFilters(eb, condition, column)
				// );

				switch (op) {
					case "$or":
						if (Array.isArray(conditions)) {
							return eb.or(
								conditions.map((condition) =>
									applyFieldLevelFilters(eb, condition, column)
								)
							);
						}

						return eb.or(
							entries(conditions).map(([op, value]) => {
								return applyFieldLevelFilters(eb, { [op]: value }, column);
							})
						);
					case "$and":
						if (Array.isArray(conditions)) {
							return eb.and(
								conditions.map((condition) =>
									applyFieldLevelFilters(eb, condition, column)
								)
							);
						}
						return eb.and(
							entries(conditions).map(([op, value]) => {
								return applyFieldLevelFilters(eb, { [op]: value }, column);
							})
						);
					case "$not":
						return eb.not(applyFieldLevelFilters(eb, conditions, column));
					default:
						const neverShouldHaveComeHere: never = op;
						throw new Error(`Unknown field level operator: ${neverShouldHaveComeHere}`);
				}
			}
			const [op, value] = condition;

			const whereFn = filterMap[op as FilterOperator];
			if (!whereFn) {
				throw new Error(`Unknown operator: ${op}`);
			}
			return whereFn(eb, column, maybeStringifiedValue(value));
		})
	);
};

type ExpressionWrapped<E extends ExpressionBuilder<any, any>> =
	E extends ExpressionBuilder<infer T, infer U> ? ExpressionWrapper<T, U, any> : never;

/**
 * main filter application function
 */
export function applyFilters<K extends ExpressionBuilder<any, any>>(
	eb: K,
	filters: Filter
): ExpressionWrapped<K> {
	// handle field filters - we treat multiple fields as an implicit AND
	const fieldConditions = entries(filters);

	if (fieldConditions.length === 0) {
		return eb.val(true) as ExpressionWrapped<K>;
	}

	return eb.and(
		fieldConditions.map((condition) => {
			if (isTopLevelEntriedLogicalFilter(condition)) {
				const [op, conditions] = condition;

				switch (op) {
					case "$and":
						if (Array.isArray(conditions)) {
							return eb.and(
								conditions.map((condition) => applyFilters(eb, condition))
							) as ExpressionWrapped<K>;
						}
						return eb.and(
							entries(conditions).map(([op, value]) =>
								applyFilters(eb, { [op]: value })
							)
						) as ExpressionWrapped<K>;
					case "$or":
						if (Array.isArray(conditions)) {
							return eb.or(
								conditions.map((condition) => applyFilters(eb, condition))
							) as ExpressionWrapped<K>;
						}
						return eb.or(
							entries(conditions).map(([op, value]) =>
								applyFilters(eb, { [op]: value })
							)
						) as ExpressionWrapped<K>;
					case "$not":
						return eb.not(applyFilters(eb, conditions)) as ExpressionWrapped<K>;
					default:
						const neverShouldHaveComeHere: never = op;
						throw new Error(`Unknown logical operator: ${neverShouldHaveComeHere}`);
				}
			}

			const [slug, fieldLevelFilter] = condition;

			const isDate = slug === "updatedAt" || slug === "createdAt";

			if (isDate) {
				// handle date fields directly on the pubs table
				return applyFieldLevelFilters(eb, fieldLevelFilter, `pubs.${slug}`);
			}

			const exists = eb.exists(
				eb
					.selectFrom("pub_values")
					.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
					.select(eb.lit(1).as("exists_check"))
					.where("pub_values.pubId", "=", eb.ref("pubs.id"))
					.where("pub_fields.slug", "=", slug)
					.where((innerEb) => {
						return applyFieldLevelFilters(innerEb, fieldLevelFilter, "value");
					})
			);

			// we need to treat the case of `$exists: false` as a special case, as it's equiv to `{$not: {$exists: true}}`, which cannot be expressed inside the EXISTS subquery
			if (fieldLevelFilter.$exists === false) {
				return eb.not(exists);
			}

			return exists;
		})
	) as ExpressionWrapped<K>;
}
