import type { ExpressionBuilder, ExpressionWrapper } from "kysely"
import type { CompiledQuery } from "./compiler"
import type {
	ComparisonCondition,
	FunctionCondition,
	LogicalCondition,
	NotCondition,
	ParsedCondition,
	PubFieldPath,
} from "./types"

import { sql } from "kysely"

import { UnsupportedExpressionError } from "./errors"

type AnyExpressionBuilder = ExpressionBuilder<any, any>
type AnyExpressionWrapper = ExpressionWrapper<any, any, any>

export interface SqlBuilderOptions {
	communitySlug?: string
}

/**
 * converts a pub field path to the appropriate sql column reference
 */
function pathToColumn(
	path: PubFieldPath
): "value" | "pubs.createdAt" | "pubs.updatedAt" | "pubs.id" | "pubs.pubTypeId" {
	if (path.kind === "builtin") {
		return `pubs.${path.field}` as const
	}
	// for value fields, we'll handle them via subquery
	return "value"
}

/**
 * resolves a field slug, optionally adding community prefix
 */
function resolveFieldSlug(fieldSlug: string, options?: SqlBuilderOptions): string {
	if (!options?.communitySlug) {
		return fieldSlug
	}
	// if already has a colon, assume it's already prefixed
	if (fieldSlug.includes(":")) {
		return fieldSlug
	}
	return `${options.communitySlug}:${fieldSlug}`
}

/**
 * builds a subquery that checks for a pub value matching certain conditions
 */
function buildValueExistsSubquery(
	eb: AnyExpressionBuilder,
	fieldSlug: string,
	buildCondition: (innerEb: AnyExpressionBuilder) => AnyExpressionWrapper,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const resolvedSlug = resolveFieldSlug(fieldSlug, options)
	return eb.exists(
		eb
			.selectFrom("pub_values")
			.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
			.select(eb.lit(1).as("exists_check"))
			.where("pub_values.pubId", "=", eb.ref("pubs.id"))
			.where("pub_fields.slug", "=", resolvedSlug)
			.where((innerEb) => buildCondition(innerEb))
	)
}

/**
 * builds a subquery for pubType conditions
 */
function buildPubTypeSubquery(
	eb: AnyExpressionBuilder,
	field: "name" | "id",
	buildCondition: (column: string) => AnyExpressionWrapper
): AnyExpressionWrapper {
	if (field === "id") {
		return buildCondition("pubs.pubTypeId")
	}
	return eb.exists(
		eb
			.selectFrom("pub_types")
			.select(eb.lit(1).as("exists_check"))
			.where("pub_types.id", "=", eb.ref("pubs.pubTypeId"))
			.where((innerEb) => buildCondition("pub_types.name"))
	)
}

/**
 * wraps a value for json comparison if needed
 */
function wrapValue(value: unknown): unknown {
	if (typeof value === "string") {
		return JSON.stringify(value)
	}
	return value
}

/**
 * builds the sql condition for a comparison
 */
function buildComparisonCondition(
	eb: AnyExpressionBuilder,
	condition: ComparisonCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { path, operator, value, pathTransform } = condition

	// handle builtin fields directly on pubs table
	// builtin fields are not json, so we don't wrap the value
	if (path.kind === "builtin") {
		const column = pathToColumn(path)
		return buildOperatorCondition(eb, column, operator, value, pathTransform, false)
	}

	// handle pubType fields (also not json)
	if (path.kind === "pubType") {
		return buildPubTypeSubquery(eb, path.field, (column) =>
			buildOperatorCondition(eb, column, operator, value, pathTransform, false)
		)
	}

	// handle value fields via subquery (json values)
	return buildValueExistsSubquery(
		eb,
		path.fieldSlug,
		(innerEb) => buildOperatorCondition(innerEb, "value", operator, value, pathTransform, true),
		options
	)
}

/**
 * builds an operator condition for a specific column
 */
function buildOperatorCondition(
	eb: AnyExpressionBuilder,
	column: string,
	operator: string,
	value: unknown,
	pathTransform?: string,
	isJsonValue = true
): AnyExpressionWrapper {
	let col: ReturnType<typeof sql.raw> | string = column

	// apply path transform (lowercase, uppercase)
	if (pathTransform === "lowercase") {
		col = sql.raw(`lower(${column}::text)`)
	} else if (pathTransform === "uppercase") {
		col = sql.raw(`upper(${column}::text)`)
	}

	const wrappedValue = isJsonValue ? wrapValue(value) : value

	switch (operator) {
		case "=":
			return eb(col, "=", wrappedValue)
		case "!=":
			return eb(col, "!=", wrappedValue)
		case "<":
			return eb(col, "<", wrappedValue)
		case "<=":
			return eb(col, "<=", wrappedValue)
		case ">":
			return eb(col, ">", wrappedValue)
		case ">=":
			return eb(col, ">=", wrappedValue)
		case "in":
			if (Array.isArray(value)) {
				return eb(col, "in", isJsonValue ? value.map(wrapValue) : value)
			}
			return eb(col, "=", wrappedValue)
		default:
			throw new UnsupportedExpressionError(`unsupported operator: ${operator}`)
	}
}

/**
 * builds the sql condition for a function call
 */
function buildFunctionCondition(
	eb: AnyExpressionBuilder,
	condition: FunctionCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { name, path, arguments: args } = condition

	// for value fields, strings are stored as JSON, so we need to account for quotes
	const isValueField = path.kind === "value"

	const buildInner = (col: string) => {
		const strArg = String(args[0])
		switch (name) {
			case "contains":
				return eb(sql.raw(`${col}::text`), "like", `%${strArg}%`)
			case "startsWith":
				// for json values, the string starts with a quote
				if (isValueField) {
					return eb(sql.raw(`${col}::text`), "like", `"${strArg}%`)
				}
				return eb(sql.raw(`${col}::text`), "like", `${strArg}%`)
			case "endsWith":
				// for json values, the string ends with a quote
				if (isValueField) {
					return eb(sql.raw(`${col}::text`), "like", `%${strArg}"`)
				}
				return eb(sql.raw(`${col}::text`), "like", `%${strArg}`)
			case "exists":
				return eb.lit(true)
			default:
				throw new UnsupportedExpressionError(`unsupported function: ${name}`)
		}
	}

	// handle builtin fields
	if (path.kind === "builtin") {
		const column = pathToColumn(path)
		if (name === "exists") {
			return eb(column, "is not", null)
		}
		return buildInner(column)
	}

	// handle pubType fields
	if (path.kind === "pubType") {
		return buildPubTypeSubquery(eb, path.field, (column) => buildInner(column))
	}

	// handle value fields
	if (name === "exists") {
		return buildValueExistsSubquery(eb, path.fieldSlug, () => eb.lit(true), options)
	}

	return buildValueExistsSubquery(eb, path.fieldSlug, () => buildInner("value"), options)
}

/**
 * builds the sql condition for a logical operation
 */
function buildLogicalCondition(
	eb: AnyExpressionBuilder,
	condition: LogicalCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const conditions = condition.conditions.map((c) => buildCondition(eb, c, options))

	if (condition.operator === "and") {
		return eb.and(conditions)
	}
	return eb.or(conditions)
}

/**
 * builds the sql condition for a not operation
 */
function buildNotCondition(
	eb: AnyExpressionBuilder,
	condition: NotCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	return eb.not(buildCondition(eb, condition.condition, options))
}

/**
 * builds the sql condition for any parsed condition
 */
function buildCondition(
	eb: AnyExpressionBuilder,
	condition: ParsedCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	switch (condition.type) {
		case "comparison":
			return buildComparisonCondition(eb, condition, options)
		case "function":
			return buildFunctionCondition(eb, condition, options)
		case "logical":
			return buildLogicalCondition(eb, condition, options)
		case "not":
			return buildNotCondition(eb, condition, options)
	}
}

/**
 * applies a compiled jsonata query as a filter to a kysely query builder
 *
 * @example
 * ```ts
 * const query = compileJsonataQuery('$.pub.values.title = "Test"')
 * const pubs = await db
 *   .selectFrom("pubs")
 *   .selectAll()
 *   .where((eb) => applyJsonataFilter(eb, query, { communitySlug: "my-community" }))
 *   .execute()
 * ```
 */
export function applyJsonataFilter<K extends AnyExpressionBuilder>(
	eb: K,
	query: CompiledQuery,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	return buildCondition(eb, query.condition, options)
}
