import type { ExpressionBuilder, ExpressionWrapper } from "kysely"
import type { CompiledQuery } from "./compiler"
import type {
	ComparisonCondition,
	ComparisonOperator,
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
	StringFunction,
	TransformFunction,
} from "./types"

import { sql } from "kysely"

import { buildSqlComparison, buildSqlExists, buildSqlStringFunction } from "./operators"

type AnyExpressionBuilder = ExpressionBuilder<any, any>
type AnyExpressionWrapper = ExpressionWrapper<any, any, any>

export interface SqlBuilderOptions {
	communitySlug?: string
	searchLanguage?: string
}

function resolveFieldSlug(fieldSlug: string, options?: SqlBuilderOptions): string {
	if (!options?.communitySlug) {
		return fieldSlug
	}
	if (fieldSlug.includes(":")) {
		return fieldSlug
	}
	return `${options.communitySlug}:${fieldSlug}`
}

// subquery builders

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
			.where(() => buildCondition("pub_types.name"))
	)
}

// column resolution for different path types

interface ColumnInfo {
	column: string
	isJsonValue: boolean
}

function pubFieldPathToColumn(path: PubFieldPath): ColumnInfo {
	switch (path.kind) {
		case "builtin":
			return { column: `pubs.${path.field}`, isJsonValue: false }
		case "pubType":
			return {
				column: path.field === "id" ? "pubs.pubTypeId" : "pub_types.name",
				isJsonValue: false,
			}
		case "value":
			return { column: "value", isJsonValue: true }
	}
}

function relationPathToColumn(path: RelationContextPath, relatedPubAlias: string): ColumnInfo {
	switch (path.kind) {
		case "relationValue":
			return { column: "pv.value", isJsonValue: true }
		case "relatedPubValue":
			return { column: "rpv.value", isJsonValue: true }
		case "relatedPubBuiltin":
			return { column: `${relatedPubAlias}.${path.field}`, isJsonValue: false }
		case "relatedPubType":
			if (path.field === "id") {
				return { column: `${relatedPubAlias}.pubTypeId`, isJsonValue: false }
			}
			return { column: "rpt.name", isJsonValue: false }
	}
}

// generic condition building

interface ConditionBuilderContext {
	eb: AnyExpressionBuilder
	options?: SqlBuilderOptions
}

function buildComparisonForColumn(
	ctx: ConditionBuilderContext,
	column: string,
	operator: ComparisonOperator,
	value: unknown,
	isJsonValue: boolean,
	transform?: TransformFunction
): AnyExpressionWrapper {
	return buildSqlComparison(ctx.eb, column, operator, value, isJsonValue, transform)
}

function buildFunctionForColumn(
	ctx: ConditionBuilderContext,
	column: string,
	funcName: StringFunction | "exists",
	args: unknown[],
	isJsonValue: boolean,
	transform?: TransformFunction
): AnyExpressionWrapper {
	if (funcName === "exists") {
		return buildSqlExists(ctx.eb, column, true)
	}
	return buildSqlStringFunction(ctx.eb, column, funcName, String(args[0]), isJsonValue, transform)
}

// top-level condition builders

function buildComparisonCondition(
	ctx: ConditionBuilderContext,
	condition: ComparisonCondition
): AnyExpressionWrapper {
	const { path, operator, value, pathTransform } = condition

	if (path.kind === "builtin") {
		const { column, isJsonValue } = pubFieldPathToColumn(path)
		return buildComparisonForColumn(ctx, column, operator, value, isJsonValue, pathTransform)
	}

	if (path.kind === "pubType") {
		return buildPubTypeSubquery(ctx.eb, path.field, (column) =>
			buildComparisonForColumn(ctx, column, operator, value, false, pathTransform)
		)
	}

	return buildValueExistsSubquery(
		ctx.eb,
		path.fieldSlug,
		(innerEb) =>
			buildComparisonForColumn(
				{ eb: innerEb, options: ctx.options },
				"value",
				operator,
				value,
				true,
				pathTransform
			),
		ctx.options
	)
}

function buildFunctionCondition(
	ctx: ConditionBuilderContext,
	condition: FunctionCondition
): AnyExpressionWrapper {
	const { name, path, arguments: args, pathTransform } = condition

	if (path.kind === "builtin") {
		const { column, isJsonValue } = pubFieldPathToColumn(path)
		if (name === "exists") {
			return ctx.eb(column, "is not", null)
		}
		return buildFunctionForColumn(ctx, column, name, args, isJsonValue, pathTransform)
	}

	if (path.kind === "pubType") {
		return buildPubTypeSubquery(ctx.eb, path.field, (column) =>
			buildFunctionForColumn(ctx, column, name, args, false, pathTransform)
		)
	}

	if (name === "exists") {
		return buildValueExistsSubquery(ctx.eb, path.fieldSlug, () => ctx.eb.lit(true), ctx.options)
	}

	return buildValueExistsSubquery(
		ctx.eb,
		path.fieldSlug,
		() => buildFunctionForColumn(ctx, "value", name, args, true, pathTransform),
		ctx.options
	)
}

function buildLogicalCondition(
	ctx: ConditionBuilderContext,
	condition: LogicalCondition
): AnyExpressionWrapper {
	const conditions = condition.conditions.map((c) => buildCondition(ctx, c))
	return condition.operator === "and" ? ctx.eb.and(conditions) : ctx.eb.or(conditions)
}

function buildNotCondition(
	ctx: ConditionBuilderContext,
	condition: NotCondition
): AnyExpressionWrapper {
	return ctx.eb.not(buildCondition(ctx, condition.condition))
}

function buildSearchCondition(
	ctx: ConditionBuilderContext,
	condition: SearchCondition
): AnyExpressionWrapper {
	const { query } = condition
	const language = ctx.options?.searchLanguage ?? "english"

	const cleanQuery = query.trim().replace(/[:@]/g, "")
	if (cleanQuery.length < 2) {
		return ctx.eb.lit(false)
	}

	const terms = cleanQuery.split(/\s+/).filter((word) => word.length >= 2)
	if (terms.length === 0) {
		return ctx.eb.lit(false)
	}

	const prefixTerms = terms.map((term) => `${term}:*`).join(" & ")

	return sql`pubs."searchVector" @@ to_tsquery(${language}::regconfig, ${prefixTerms})` as unknown as AnyExpressionWrapper
}

// relation filter builders

interface RelationFilterContext {
	eb: AnyExpressionBuilder
	relatedPubAlias: string
	options?: SqlBuilderOptions
}

function buildRelationComparisonCondition(
	ctx: RelationFilterContext,
	condition: RelationComparisonCondition
): AnyExpressionWrapper {
	const { path, operator, value, pathTransform } = condition
	const { column, isJsonValue } = relationPathToColumn(path, ctx.relatedPubAlias)

	if (path.kind === "relatedPubValue") {
		const resolvedSlug = resolveFieldSlug(path.fieldSlug, ctx.options)
		return ctx.eb.exists(
			ctx.eb
				.selectFrom("pub_values as rpv")
				.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
				.select(ctx.eb.lit(1).as("rpv_check"))
				.where("rpv.pubId", "=", ctx.eb.ref(`${ctx.relatedPubAlias}.id`))
				.where("rpf.slug", "=", resolvedSlug)
				.where((innerEb) =>
					buildSqlComparison(innerEb, "rpv.value", operator, value, true, pathTransform)
				)
		)
	}

	if (path.kind === "relatedPubType" && path.field === "name") {
		return ctx.eb.exists(
			ctx.eb
				.selectFrom("pub_types as rpt")
				.select(ctx.eb.lit(1).as("rpt_check"))
				.where("rpt.id", "=", ctx.eb.ref(`${ctx.relatedPubAlias}.pubTypeId`))
				.where((innerEb) =>
					buildSqlComparison(innerEb, "rpt.name", operator, value, false, pathTransform)
				)
		)
	}

	return buildSqlComparison(ctx.eb, column, operator, value, isJsonValue, pathTransform)
}

function buildRelationFunctionCondition(
	ctx: RelationFilterContext,
	condition: RelationFunctionCondition
): AnyExpressionWrapper {
	const { name, path, arguments: args, pathTransform } = condition

	if (path.kind === "relatedPubValue") {
		const resolvedSlug = resolveFieldSlug(path.fieldSlug, ctx.options)
		if (name === "exists") {
			return ctx.eb.exists(
				ctx.eb
					.selectFrom("pub_values as rpv")
					.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
					.select(ctx.eb.lit(1).as("rpv_check"))
					.where("rpv.pubId", "=", ctx.eb.ref(`${ctx.relatedPubAlias}.id`))
					.where("rpf.slug", "=", resolvedSlug)
			)
		}
		return ctx.eb.exists(
			ctx.eb
				.selectFrom("pub_values as rpv")
				.innerJoin("pub_fields as rpf", "rpf.id", "rpv.fieldId")
				.select(ctx.eb.lit(1).as("rpv_check"))
				.where("rpv.pubId", "=", ctx.eb.ref(`${ctx.relatedPubAlias}.id`))
				.where("rpf.slug", "=", resolvedSlug)
				.where(() =>
					buildSqlStringFunction(
						ctx.eb,
						"rpv.value",
						name as StringFunction,
						String(args[0]),
						true,
						pathTransform
					)
				)
		)
	}

	const { column, isJsonValue } = relationPathToColumn(path, ctx.relatedPubAlias)

	if (name === "exists") {
		return ctx.eb(column, "is not", null)
	}

	return buildSqlStringFunction(
		ctx.eb,
		column,
		name as StringFunction,
		String(args[0]),
		isJsonValue,
		pathTransform
	)
}

function buildRelationFilter(
	ctx: RelationFilterContext,
	filter: RelationFilterCondition
): AnyExpressionWrapper {
	switch (filter.type) {
		case "relationComparison":
			return buildRelationComparisonCondition(ctx, filter)
		case "relationFunction":
			return buildRelationFunctionCondition(ctx, filter)
		case "relationLogical": {
			const conditions = filter.conditions.map((c) => buildRelationFilter(ctx, c))
			return filter.operator === "and" ? ctx.eb.and(conditions) : ctx.eb.or(conditions)
		}
		case "relationNot":
			return ctx.eb.not(buildRelationFilter(ctx, filter.condition))
	}
}

function buildRelationCondition(
	ctx: ConditionBuilderContext,
	condition: RelationCondition
): AnyExpressionWrapper {
	const { direction, fieldSlug, filter } = condition
	const resolvedSlug = resolveFieldSlug(fieldSlug, ctx.options)

	if (direction === "out") {
		let subquery = ctx.eb
			.selectFrom("pub_values as pv")
			.innerJoin("pub_fields as pf", "pf.id", "pv.fieldId")
			.innerJoin("pubs as related_pub", "related_pub.id", "pv.relatedPubId")
			.select(ctx.eb.lit(1).as("rel_check"))
			.where("pv.pubId", "=", ctx.eb.ref("pubs.id"))
			.where("pf.slug", "=", resolvedSlug)
			.where("pv.relatedPubId", "is not", null)

		if (filter) {
			subquery = subquery.where((innerEb) =>
				buildRelationFilter(
					{ eb: innerEb, relatedPubAlias: "related_pub", options: ctx.options },
					filter
				)
			)
		}

		return ctx.eb.exists(subquery)
	}

	let subquery = ctx.eb
		.selectFrom("pub_values as pv")
		.innerJoin("pub_fields as pf", "pf.id", "pv.fieldId")
		.innerJoin("pubs as source_pub", "source_pub.id", "pv.pubId")
		.select(ctx.eb.lit(1).as("rel_check"))
		.where("pv.relatedPubId", "=", ctx.eb.ref("pubs.id"))
		.where("pf.slug", "=", resolvedSlug)

	if (filter) {
		subquery = subquery.where((innerEb) =>
			buildRelationFilter(
				{ eb: innerEb, relatedPubAlias: "source_pub", options: ctx.options },
				filter
			)
		)
	}

	return ctx.eb.exists(subquery)
}

// main condition dispatcher

function buildCondition(
	ctx: ConditionBuilderContext,
	condition: ParsedCondition
): AnyExpressionWrapper {
	switch (condition.type) {
		case "comparison":
			return buildComparisonCondition(ctx, condition)
		case "function":
			return buildFunctionCondition(ctx, condition)
		case "logical":
			return buildLogicalCondition(ctx, condition)
		case "not":
			return buildNotCondition(ctx, condition)
		case "search":
			return buildSearchCondition(ctx, condition)
		case "relation":
			return buildRelationCondition(ctx, condition)
	}
}

// public api

export function applyJsonataFilter<K extends AnyExpressionBuilder>(
	eb: K,
	query: CompiledQuery,
	options?: SqlBuilderOptions
): AnyExpressionWrapper {
	return buildCondition({ eb, options }, query.condition)
}
