import type { ExpressionBuilder, ExpressionWrapper, RawBuilder } from "kysely"
import type { CompiledQuery } from "./compiler"
import type {
	ComparisonCondition,
	FunctionCondition,
	LogicalCondition,
	NotCondition,
	ParsedCondition,
	PubFieldPath,
	RelationComparisonCondition,
	RelationCondition,
	RelationContextPath,
	RelationFilterCondition,
	RelationFunctionCondition,
	SearchCondition,
} from "./types"

import { sql } from "kysely"

import { UnsupportedExpressionError } from "./errors"

type AnyExpressionBuilder = ExpressionBuilder<any, any>
type AnyExpressionWrapper = ExpressionWrapper<any, any, any>

export interface SqlBuilderOptions {
	communitySlug?: string
	// search config for full-text search
	searchLanguage?: string
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
			.where((_innerEb) => buildCondition("pub_types.name"))
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
 * builds the sql condition for a full-text search
 */
function buildSearchCondition(
	eb: AnyExpressionBuilder,
	condition: SearchCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { query } = condition
	const language = options?.searchLanguage ?? "english"

	// clean and prepare search terms
	const cleanQuery = query.trim().replace(/[:@]/g, "")
	if (cleanQuery.length < 2) {
		return eb.lit(false)
	}

	const terms = cleanQuery.split(/\s+/).filter((word) => word.length >= 2)
	if (terms.length === 0) {
		return eb.lit(false)
	}

	// build tsquery with prefix matching for better UX
	const prefixTerms = terms.map((term) => `${term}:*`).join(" & ")

	// searchVector is on pubs table
	return sql`pubs."searchVector" @@ to_tsquery(${language}::regconfig, ${prefixTerms})` as unknown as AnyExpressionWrapper
}

// ============================================================================
// relation filter sql building
// ============================================================================

/**
 * converts a relation context path to the appropriate column reference for subquery
 */
function relationPathToColumn(
	path: RelationContextPath,
	relatedPubAlias: string
): { column: string; isJsonValue: boolean } {
	switch (path.kind) {
		case "relationValue":
			return { column: "pv.value", isJsonValue: true }
		case "relatedPubValue":
			// we'll handle this via another subquery
			return { column: "rpv.value", isJsonValue: true }
		case "relatedPubBuiltin":
			return { column: `${relatedPubAlias}.${path.field}`, isJsonValue: false }
		case "relatedPubType":
			if (path.field === "id") {
				return { column: `${relatedPubAlias}.pubTypeId`, isJsonValue: false }
			}
			// name requires a join to pub_types
			return { column: "rpt.name", isJsonValue: false }
	}
}

/**
 * builds a relation filter condition for use in a subquery
 */
function buildRelationFilterOperator(
	eb: AnyExpressionBuilder,
	column: string,
	operator: string,
	value: unknown,
	pathTransform: string | undefined,
	isJsonValue: boolean
): AnyExpressionWrapper {
	let col: RawBuilder<unknown> | string = column

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
			throw new UnsupportedExpressionError(
				`unsupported operator in relation filter: ${operator}`
			)
	}
}

/**
 * builds a condition for a relation comparison
 */
function buildRelationComparisonCondition(
	eb: AnyExpressionBuilder,
	condition: RelationComparisonCondition,
	relatedPubAlias: string,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { path, operator, value, pathTransform } = condition
	const { column, isJsonValue } = relationPathToColumn(path, relatedPubAlias)

	// for relatedPubValue, we need to join to the related pub's values
	if (path.kind === "relatedPubValue") {
		const resolvedSlug = resolveFieldSlug(path.fieldSlug, options)
		return eb.exists(
			eb
				.selectFrom("pub_values as rpv")
				.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
				.select(eb.lit(1).as("rpv_check"))
				.where("rpv.pubId", "=", eb.ref(`${relatedPubAlias}.id`))
				.where("rpf.slug", "=", resolvedSlug)
				.where((innerEb) =>
					buildRelationFilterOperator(
						innerEb,
						"rpv.value",
						operator,
						value,
						pathTransform,
						true
					)
				)
		)
	}

	// for relatedPubType name, need a subquery to pub_types
	if (path.kind === "relatedPubType" && path.field === "name") {
		return eb.exists(
			eb
				.selectFrom("pub_types as rpt")
				.select(eb.lit(1).as("rpt_check"))
				.where("rpt.id", "=", eb.ref(`${relatedPubAlias}.pubTypeId`))
				.where((innerEb) =>
					buildRelationFilterOperator(
						innerEb,
						"rpt.name",
						operator,
						value,
						pathTransform,
						false
					)
				)
		)
	}

	return buildRelationFilterOperator(eb, column, operator, value, pathTransform, isJsonValue)
}

/**
 * builds a condition for a relation function call
 */
function buildRelationFunctionCondition(
	eb: AnyExpressionBuilder,
	condition: RelationFunctionCondition,
	relatedPubAlias: string,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { name, path, arguments: args } = condition

	const buildFunctionInner = (col: string, isJson: boolean) => {
		const strArg = String(args[0])
		switch (name) {
			case "contains":
				return eb(sql.raw(`${col}::text`), "like", `%${strArg}%`)
			case "startsWith":
				if (isJson) {
					return eb(sql.raw(`${col}::text`), "like", `"${strArg}%`)
				}
				return eb(sql.raw(`${col}::text`), "like", `${strArg}%`)
			case "endsWith":
				if (isJson) {
					return eb(sql.raw(`${col}::text`), "like", `%${strArg}"`)
				}
				return eb(sql.raw(`${col}::text`), "like", `%${strArg}`)
			case "exists":
				return eb.lit(true)
			default:
				throw new UnsupportedExpressionError(
					`unsupported function in relation filter: ${name}`
				)
		}
	}

	// handle relatedPubValue - need subquery
	if (path.kind === "relatedPubValue") {
		const resolvedSlug = resolveFieldSlug(path.fieldSlug, options)
		if (name === "exists") {
			return eb.exists(
				eb
					.selectFrom("pub_values as rpv")
					.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
					.select(eb.lit(1).as("rpv_check"))
					.where("rpv.pubId", "=", eb.ref(`${relatedPubAlias}.id`))
					.where("rpf.slug", "=", resolvedSlug)
			)
		}
		return eb.exists(
			eb
				.selectFrom("pub_values as rpv")
				.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
				.select(eb.lit(1).as("rpv_check"))
				.where("rpv.pubId", "=", eb.ref(`${relatedPubAlias}.id`))
				.where("rpf.slug", "=", resolvedSlug)
				.where(() => buildFunctionInner("rpv.value", true))
		)
	}

	// handle relationValue ($.value)
	if (path.kind === "relationValue") {
		if (name === "exists") {
			return eb("pv.value", "is not", null)
		}
		return buildFunctionInner("pv.value", true)
	}

	// handle builtin fields
	const { column, isJsonValue } = relationPathToColumn(path, relatedPubAlias)
	if (name === "exists") {
		return eb(column, "is not", null)
	}
	return buildFunctionInner(column, isJsonValue)
}

/**
 * builds a relation filter condition recursively
 */
function buildRelationFilter(
	eb: AnyExpressionBuilder,
	filter: RelationFilterCondition,
	relatedPubAlias: string,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	switch (filter.type) {
		case "relationComparison":
			return buildRelationComparisonCondition(eb, filter, relatedPubAlias, options)
		case "relationFunction":
			return buildRelationFunctionCondition(eb, filter, relatedPubAlias, options)
		case "relationLogical": {
			const conditions = filter.conditions.map((c) =>
				buildRelationFilter(eb, c, relatedPubAlias, options)
			)
			return filter.operator === "and" ? eb.and(conditions) : eb.or(conditions)
		}
		case "relationNot":
			return eb.not(buildRelationFilter(eb, filter.condition, relatedPubAlias, options))
	}
}

/**
 * builds the sql condition for a relation query
 *
 * for "out" relations: find pubs where there's a pub_value with relatedPubId pointing out
 * for "in" relations: find pubs that are referenced by other pubs via the given field
 */
function buildRelationCondition(
	eb: AnyExpressionBuilder,
	condition: RelationCondition,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	const { direction, fieldSlug, filter } = condition
	const resolvedSlug = resolveFieldSlug(fieldSlug, options)

	if (direction === "out") {
		// outgoing relation: this pub has a value that points to another pub
		// pv.pubId = pubs.id and pv.relatedPubId = related_pub.id
		let subquery = eb
			.selectFrom("pub_values as pv")
			.innerJoin("pub_fields as pf", "pf.id", "pv.fieldId")
			.innerJoin("pubs as related_pub", "related_pub.id", "pv.relatedPubId")
			.select(eb.lit(1).as("rel_check"))
			.where("pv.pubId", "=", eb.ref("pubs.id"))
			.where("pf.slug", "=", resolvedSlug)
			.where("pv.relatedPubId", "is not", null)

		if (filter) {
			subquery = subquery.where((innerEb) =>
				buildRelationFilter(innerEb, filter, "related_pub", options)
			)
		}

		return eb.exists(subquery)
	}

	// incoming relation: another pub has a value pointing to this pub
	// pv.relatedPubId = pubs.id and pv.pubId = source_pub.id
	let subquery = eb
		.selectFrom("pub_values as pv")
		.innerJoin("pub_fields as pf", "pf.id", "pv.fieldId")
		.innerJoin("pubs as source_pub", "source_pub.id", "pv.pubId")
		.select(eb.lit(1).as("rel_check"))
		.where("pv.relatedPubId", "=", eb.ref("pubs.id"))
		.where("pf.slug", "=", resolvedSlug)

	if (filter) {
		// for incoming, the "relatedPub" in the filter context is the source_pub
		subquery = subquery.where((innerEb) =>
			buildRelationFilter(innerEb, filter, "source_pub", options)
		)
	}

	return eb.exists(subquery)
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
		case "search":
			return buildSearchCondition(eb, condition, options)
		case "relation":
			return buildRelationCondition(eb, condition, options)
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
