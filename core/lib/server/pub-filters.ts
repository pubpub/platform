import type { ExpressionBuilder, ExpressionWrapper } from "kysely";

import { sql } from "kysely";

import type {
	FieldLevelFilter,
	Filter,
	FilterOperator,
	LogicalFilter,
	LogicalOperator,
} from "contracts";
import { logicalOperators } from "contracts";
import { CoreSchemaType } from "db/public";
import { assert } from "utils";

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
	"$in",
	"$notIn",
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
		"$in",
		"$notIn",
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
		"$in",
		"$notIn",
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

/**
 * Checks if an object is a field-level logical operator
 */
const isFieldLevelLogicalOperator = (obj: any): boolean => {
	if (typeof obj !== "object" || obj === null) {
		return false;
	}

	const keys = Object.keys(obj);
	return keys.length === 1 && logicalOperators.includes(keys[0] as LogicalOperator);
};

/**
 * Apply operators for a single field
 */
export const applyFieldOperators = <K extends ExpressionBuilder<any, any>>(
	eb: K,
	operators: Record<string, any>,
	column: "value" | "pubs.updatedAt" | "pubs.createdAt"
): ExpressionWrapper<any, any, any> => {
	const keys = Object.keys(operators);
	// check if this is a field-level logical operator like { $or: {...} }
	// TODO: doesn't per se need to be length 1
	if (keys.length === 1 && logicalOperators.includes(keys[0] as LogicalOperator)) {
		const operator = keys[0] as LogicalOperator;
		const conditions = operators[operator];

		if (operator === "$or") {
			return eb.or(
				Object.entries(conditions).map(([op, value]) => {
					if (isFieldLevelLogicalOperator({ [op]: value })) {
						return applyFieldOperators(eb, { [op]: value }, column);
					}
					const whereFn = filterMap[op as FilterOperator];
					if (!whereFn) {
						throw new Error(`Unknown operator: ${op}`);
					}
					return whereFn(eb, column, maybeStringifiedValue(value));
				})
			);
		} else if (operator === "$and") {
			return eb.and(
				Object.entries(conditions).map(([op, value]) => {
					if (isFieldLevelLogicalOperator({ [op]: value })) {
						return applyFieldOperators(eb, { [op]: value }, column);
					}
					const whereFn = filterMap[op as FilterOperator];
					if (!whereFn) {
						throw new Error(`Unknown operator: ${op}`);
					}
					return whereFn(eb, column, maybeStringifiedValue(value));
				})
			);
		} else if (operator === "$not") {
			return eb.not(applyFieldOperators(eb, conditions, column));
		}
	}

	// Regular field operators
	return eb.and(
		Object.entries(operators).map(([op, value]) => {
			if (isFieldLevelLogicalOperator({ [op]: value })) {
				return applyFieldOperators(eb, { [op]: value }, column);
			}
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
	// top-level logical operators
	if (filters.$and) {
		return eb.and(
			// @ts-expect-error TODO: FIX
			filters.$and.map((condition) => applyFilters(eb, condition))
		) as ExpressionWrapped<K>;
	} else if (filters.$or) {
		return eb.or(
			// @ts-expect-error TODO: FIX
			filters.$or.map((condition) => applyFilters(eb, condition))
		) as ExpressionWrapped<K>;
	} else if (filters.$not) {
		return eb.not(applyFilters(eb, filters.$not)) as ExpressionWrapped<K>;
	}

	// handle field filters - we treat multiple fields as an implicit AND
	const fieldConditions = Object.entries(filters);

	if (fieldConditions.length === 0) {
		return eb.val(true) as ExpressionWrapped<K>;
	}

	return eb.and(
		fieldConditions.map(([field, operators]) => {
			const isDate = field === "updatedAt" || field === "createdAt";

			if (isDate) {
				// handle date fields directly on the pubs table
				return applyFieldOperators(eb, operators, `pubs.${field}`);
			} else {
				// for regular fields, use EXISTS subquery
				return eb.exists(
					eb
						.selectFrom("pub_values")
						.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
						.select(eb.lit(1).as("exists_check"))
						.where("pub_values.pubId", "=", eb.ref("pubs.id"))
						.where("pub_fields.slug", "=", field)
						.where((innerEb) => {
							return applyFieldOperators(innerEb, operators, "value");
						})
				);
			}
		})
	) as ExpressionWrapped<K>;
}
