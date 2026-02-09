// pubpub-specific quata integration
// compiles jsonata filter expressions to sql conditions for getPubsWithRelatedValues
//
// handles pubpub-specific patterns:
// - values.fieldSlug -> EXISTS subquery on pub_values + pub_fields
// - pubType.name -> JOIN to pub_types
// - stage.name -> JOIN through PubsInStages to stages
// - direct fields (title, createdAt) -> column references on pubs

import type { ExprNode } from "@pubpub/quata"
import type { ExpressionBuilder, ExpressionWrapper } from "kysely"

import { sql } from "kysely"

import { parseExpression } from "@pubpub/quata"

// a compiled filter that can be applied to a kysely expression builder
export interface CompiledPubFilter {
	// apply this filter as a WHERE condition
	apply: <DB, TB extends keyof DB>(
		eb: ExpressionBuilder<DB, TB>,
		pubTableRef: string
	) => ExpressionWrapper<DB, TB, any>
	// the original expression (after shorthand expansion)
	expandedExpression: string
	// extracted sort/limit info
	orderBy: Array<{ field: string; direction: "asc" | "desc" }> | null
	limit: number | null
	offset: number | null
}

// the fields directly on the pubs table
const DIRECT_PUB_FIELDS = new Set([
	"id",
	"title",
	"createdAt",
	"updatedAt",
	"communityId",
	"pubTypeId",
])

export interface PubPubQuataOptions {
	communitySlug: string
}

// compile a jsonata filter expression into a sql condition for pubs
export function compilePubFilter(
	expression: string,
	options: PubPubQuataOptions
): CompiledPubFilter {
	const expanded = expandShorthands(expression, options.communitySlug)
	const ast = parseExpression(expanded)

	// extract the filter, sort, and limit parts from the ast
	const { filterAst, orderBy, limit, offset } = extractQueryParts(ast)

	return {
		expandedExpression: expanded,
		orderBy,
		limit,
		offset,
		apply: (eb, pubTableRef) => {
			if (!filterAst) {
				return eb.val(true) as any
			}
			return translateFilterAst(eb, filterAst, pubTableRef, options.communitySlug)
		},
	}
}

// expand user-facing shorthands to valid jsonata
// values.fieldSlug -> values[field.slug = 'communitySlug:fieldSlug'].value
// values['field-slug'] -> values[field.slug = 'communitySlug:field-slug'].value
// out['slug'] -> out['communitySlug:slug']
// in['slug'] -> in['communitySlug:slug']
// this keeps the expression valid jsonata for frontend preview
function expandShorthands(expression: string, communitySlug: string): string {
	// dot notation: values.fieldSlug (not followed by . or [ or ()
	// field slugs are lowercased by slugifyString, so we lowercase the match
	let result = expression.replace(
		/values\.([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*[.[(])/g,
		(_match, fieldSlug) =>
			`values[field.slug = '${communitySlug}:${fieldSlug.toLowerCase()}'].value`
	)

	// bracket notation: values['field-slug'] or values["field-slug"]
	// this handles slugs with dashes or other non-identifier characters
	result = result.replace(
		/values\[['"]([^'"]+)['"]\]/g,
		(_match, fieldSlug) =>
			`values[field.slug = '${communitySlug}:${fieldSlug.toLowerCase()}'].value`
	)

	// out['slug'] -> out['communitySlug:slug'] (prefix community slug for relation fields)
	// only prefix if the slug doesn't already contain a colon
	result = result.replace(
		/out\[['"]([^'"]+)['"]\]/g,
		(_match, slug) => {
			const prefixed = slug.includes(":") ? slug : `${communitySlug}:${slug.toLowerCase()}`
			return `out['${prefixed}']`
		}
	)

	// in['slug'] -> in['communitySlug:slug']
	result = result.replace(
		/in\[['"]([^'"]+)['"]\]/g,
		(_match, slug) => {
			const prefixed = slug.includes(":") ? slug : `${communitySlug}:${slug.toLowerCase()}`
			return `in['${prefixed}']`
		}
	)

	return result
}

// extract the different query parts from a quata-style expression
// $$pubs[filter]^(>field)[[0..9]] -> { filterAst, orderBy, limit, offset }
function extractQueryParts(ast: ExprNode): {
	filterAst: ExprNode | null
	orderBy: Array<{ field: string; direction: "asc" | "desc" }> | null
	limit: number | null
	offset: number | null
} {
	let filterAst: ExprNode | null = null
	let orderBy: Array<{ field: string; direction: "asc" | "desc" }> | null = null
	let limit: number | null = null
	let offset: number | null = null

	// handle path expression (most common: $$pubs[filter]^(sort)[[limit]])
	if (ast.type === "path") {
		const pathNode = ast as unknown as { steps: ExprNode[] }
		for (const step of pathNode.steps) {
			if (step.type === "variable") {
				const varNode = step as unknown as {
					value: string
					predicate?: Array<{ type: string; expr?: ExprNode }>
				}
				if (varNode.predicate) {
					for (const pred of varNode.predicate) {
						if (pred.type !== "filter" || !pred.expr) continue
						const parsed = parseLimitOrFilter(pred.expr)
						if (parsed.type === "limit") {
							limit = parsed.limit
							offset = parsed.offset
						} else {
							filterAst = combineFilters(filterAst, pred.expr)
						}
					}
				}
			}

			if (step.type === "sort") {
				const sortNode = step as unknown as {
					terms: Array<{ expression: ExprNode; descending: boolean }>
					stages?: Array<{ type: string; expr?: ExprNode }>
				}
				orderBy = sortNode.terms.map((term) => ({
					field: extractFieldName(term.expression),
					direction: term.descending ? ("desc" as const) : ("asc" as const),
				}))
				if (sortNode.stages) {
					for (const stage of sortNode.stages) {
						if (stage.type !== "filter" || !stage.expr) continue
						const parsed = parseLimitOrFilter(stage.expr)
						if (parsed.type === "limit") {
							limit = parsed.limit
							offset = parsed.offset
						}
					}
				}
			}
		}
		return { filterAst, orderBy, limit, offset }
	}

	// handle simple variable expression: $$pubs[filter]
	if (ast.type === "variable") {
		const varNode = ast as unknown as {
			value: string
			predicate?: Array<{ type: string; expr?: ExprNode }>
		}
		if (varNode.predicate) {
			for (const pred of varNode.predicate) {
				if (pred.type !== "filter" || !pred.expr) continue
				const parsed = parseLimitOrFilter(pred.expr)
				if (parsed.type === "limit") {
					limit = parsed.limit
					offset = parsed.offset
				} else {
					filterAst = combineFilters(filterAst, pred.expr)
				}
			}
		}
	}

	return { filterAst, orderBy, limit, offset }
}

function parseLimitOrFilter(
	expr: ExprNode
): { type: "limit"; limit: number; offset: number | null } | { type: "filter" } {
	if (expr.type === "number") {
		const idx = (expr as unknown as { value: number }).value
		return { type: "limit", limit: 1, offset: idx > 0 ? idx : null }
	}
	if (expr.type === "unary") {
		const unary = expr as unknown as { value: string; expressions?: ExprNode[] }
		if (unary.value === "[" && unary.expressions?.length === 1) {
			const range = unary.expressions[0] as unknown as {
				type: string
				value: string
				lhs?: { value: number }
				rhs?: { value: number }
			}
			if (range.type === "binary" && range.value === "..") {
				const start = range.lhs?.value ?? 0
				const end = range.rhs?.value ?? 0
				return {
					type: "limit",
					limit: end - start + 1,
					offset: start > 0 ? start : null,
				}
			}
		}
	}
	return { type: "filter" }
}

function combineFilters(existing: ExprNode | null, newFilter: ExprNode): ExprNode {
	if (!existing) return newFilter
	// create a synthetic AND node
	return {
		type: "binary",
		value: "and",
		position: 0,
		lhs: existing,
		rhs: newFilter,
	} as unknown as ExprNode
}

function extractFieldName(expr: ExprNode): string {
	if (expr.type === "name") {
		return (expr as unknown as { value: string }).value
	}
	if (expr.type === "path") {
		const pathNode = expr as unknown as { steps: ExprNode[] }
		return pathNode.steps.map((s) => (s as unknown as { value: string }).value).join(".")
	}
	return "unknown"
}

// translate a filter ast node to a kysely expression
function translateFilterAst<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	node: ExprNode,
	pubRef: string,
	communitySlug: string
): ExpressionWrapper<DB, TB, any> {
	const n = node as unknown as Record<string, any>

	if (node.type === "binary") {
		return translateBinaryFilter(eb, n, pubRef, communitySlug)
	}

	if (node.type === "function") {
		return translateFunctionFilter(eb, n, pubRef, communitySlug)
	}

	if (node.type === "unary" && n.value === "-") {
		// negation
		const inner = translateFilterAst(eb, n.expression, pubRef, communitySlug)
		return eb.not(inner) as ExpressionWrapper<DB, TB, any>
	}

	// fallback: treat as truthy
	return eb.val(true) as any
}

function translateBinaryFilter<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	node: Record<string, any>,
	pubRef: string,
	communitySlug: string
): ExpressionWrapper<DB, TB, any> {
	const op = node.value as string

	// boolean logic
	if (op === "and") {
		const left = translateFilterAst(eb, node.lhs, pubRef, communitySlug)
		const right = translateFilterAst(eb, node.rhs, pubRef, communitySlug)
		return eb.and([left, right]) as ExpressionWrapper<DB, TB, any>
	}
	if (op === "or") {
		const left = translateFilterAst(eb, node.lhs, pubRef, communitySlug)
		const right = translateFilterAst(eb, node.rhs, pubRef, communitySlug)
		return eb.or([left, right]) as ExpressionWrapper<DB, TB, any>
	}

	// comparison operators
	if (["=", "!=", "<", "<=", ">", ">=", "in"].includes(op)) {
		return translateComparison(eb, node.lhs, op, node.rhs, pubRef, communitySlug)
	}

	return eb.val(true) as any
}

// the core comparison translator
// dispatches based on whether the left side is a direct field, value access, or relation path
function translateComparison<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	lhs: Record<string, any>,
	op: string,
	rhs: Record<string, any>,
	pubRef: string,
	communitySlug: string
): ExpressionWrapper<DB, TB, any> {
	const leftPath = resolvePath(lhs)
	const rightValue = resolveValue(rhs)

	if (!leftPath) {
		return eb.val(true) as any
	}

	if (leftPath.type === "value_access") {
		return buildValueExistsSubquery(eb, leftPath.fieldSlug, op, rightValue, pubRef)
	}

	if (leftPath.type === "relation") {
		return buildRelationCondition(eb, leftPath.relation, leftPath.field, op, rightValue, pubRef)
	}

	if (leftPath.type === "direct") {
		const sqlOp = mapOperator(op)
		const ref = sql.ref(`${pubRef}.${leftPath.field}`)
		if (rightValue === null) {
			return op === "="
				? (eb(ref as any, "is", null) as any)
				: (eb(ref as any, "is not", null) as any)
		}
		return eb(ref as any, sqlOp as any, rightValue) as any
	}

	// outgoing relation with direct field: out['slug'].title
	if (leftPath.type === "out_direct") {
		return buildOutRelationDirectCondition(
			eb, leftPath.relationSlug, leftPath.field, op, rightValue, pubRef
		)
	}

	// outgoing relation with value access: out['slug'].values.fieldSlug
	if (leftPath.type === "out_value") {
		return buildOutRelationValueCondition(
			eb, leftPath.relationSlug, leftPath.valueFieldSlug, op, rightValue, pubRef
		)
	}

	// incoming relation with direct field: in['slug'].title
	if (leftPath.type === "in_direct") {
		return buildInRelationDirectCondition(
			eb, leftPath.relationSlug, leftPath.field, op, rightValue, pubRef
		)
	}

	// incoming relation with value access: in['slug'].values.fieldSlug
	if (leftPath.type === "in_value") {
		return buildInRelationValueCondition(
			eb, leftPath.relationSlug, leftPath.valueFieldSlug, op, rightValue, pubRef
		)
	}

	return eb.val(true) as any
}

type ResolvedPath =
	| { type: "direct"; field: string }
	| { type: "value_access"; fieldSlug: string }
	| { type: "relation"; relation: string; field: string }
	| { type: "out_direct"; relationSlug: string; field: string }
	| { type: "out_value"; relationSlug: string; valueFieldSlug: string }
	| { type: "in_direct"; relationSlug: string; field: string }
	| { type: "in_value"; relationSlug: string; valueFieldSlug: string }

// extract a bare string from a filter predicate (for bracket notation: name['string'])
function extractStringFilter(predicates: Array<Record<string, any>>): string | null {
	for (const pred of predicates) {
		if (pred.type === "filter" && pred.expr?.type === "string") {
			return pred.expr.value as string
		}
	}
	return null
}

// resolve remaining path steps after an out/in prefix to determine the nested access type
function resolveNestedAccess(steps: Array<Record<string, any>>): {
	type: "direct"
	field: string
} | {
	type: "value_access"
	fieldSlug: string
} | null {
	if (steps.length === 0) return null

	// single step: direct field (e.g., .title)
	if (steps.length === 1 && steps[0]?.type === "name") {
		return { type: "direct", field: steps[0].value as string }
	}

	// values[field.slug = '...'].value pattern (expanded from values.fieldSlug)
	if (steps[0]?.value === "values" && (steps[0]?.stages || steps[0]?.predicate)) {
		const filterSource = steps[0].stages ?? steps[0].predicate
		const fieldSlug = extractFieldSlugFromPredicate(filterSource)
		if (fieldSlug) {
			return { type: "value_access", fieldSlug }
		}
	}

	return null
}

function resolvePath(node: Record<string, any>): ResolvedPath | null {
	if (node.type === "name") {
		const name = node.value as string
		if (DIRECT_PUB_FIELDS.has(name)) {
			return { type: "direct", field: name }
		}
		return null
	}

	if (node.type !== "path") return null

	const steps = node.steps as Array<Record<string, any>>
	if (steps.length === 0) return null

	const firstName = steps[0]?.value as string | undefined
	if (!firstName) return null

	// out['slug'].field or out['slug'].values.fieldSlug
	if (firstName === "out" && (steps[0]?.stages || steps[0]?.predicate)) {
		const filterSource = steps[0].stages ?? steps[0].predicate
		const relationSlug = extractStringFilter(filterSource)
		if (relationSlug) {
			const nested = resolveNestedAccess(steps.slice(1))
			if (nested?.type === "direct") {
				return { type: "out_direct", relationSlug, field: nested.field }
			}
			if (nested?.type === "value_access") {
				return { type: "out_value", relationSlug, valueFieldSlug: nested.fieldSlug }
			}
		}
	}

	// in['slug'].field or in['slug'].values.fieldSlug
	if (firstName === "in" && (steps[0]?.stages || steps[0]?.predicate)) {
		const filterSource = steps[0].stages ?? steps[0].predicate
		const relationSlug = extractStringFilter(filterSource)
		if (relationSlug) {
			const nested = resolveNestedAccess(steps.slice(1))
			if (nested?.type === "direct") {
				return { type: "in_direct", relationSlug, field: nested.field }
			}
			if (nested?.type === "value_access") {
				return { type: "in_value", relationSlug, valueFieldSlug: nested.fieldSlug }
			}
		}
	}

	// values[field.slug = '...'].value pattern
	if (firstName === "values" && (steps[0]?.stages || steps[0]?.predicate)) {
		const filterSource = steps[0].stages ?? steps[0].predicate
		const fieldSlug = extractFieldSlugFromPredicate(filterSource)
		if (fieldSlug) {
			return { type: "value_access", fieldSlug }
		}
	}

	// relation paths: pubType.name, stage.name
	if (steps.length === 2 && steps[1]?.type === "name") {
		const relationName = firstName
		const fieldName = steps[1].value as string
		if (!DIRECT_PUB_FIELDS.has(relationName)) {
			return { type: "relation", relation: relationName, field: fieldName }
		}
	}

	// single step direct field
	if (steps.length === 1 && DIRECT_PUB_FIELDS.has(firstName)) {
		return { type: "direct", field: firstName }
	}

	return null
}

// extract the field slug from a values[field.slug = '...'] or values['slug'] predicate
function extractFieldSlugFromPredicate(predicates: Array<Record<string, any>>): string | null {
	for (const pred of predicates) {
		if (pred.type !== "filter" || !pred.expr) continue
		const expr = pred.expr

		// expanded form: field.slug = 'communitySlug:someSlug'
		if (expr.type === "binary" && expr.value === "=") {
			const lhs = expr.lhs
			const rhs = expr.rhs

			if (lhs?.type === "path") {
				const steps = lhs.steps as Array<Record<string, any>>
				if (
					steps.length === 2 &&
					steps[0]?.value === "field" &&
					steps[1]?.value === "slug"
				) {
					if (rhs?.type === "string") {
						return rhs.value as string
					}
				}
			}
		}

		// bracket notation fallback: values['slug'] parses as a string filter
		// the string is treated as a field slug (without community prefix)
		if (expr.type === "string") {
			return expr.value as string
		}
	}
	return null
}

// resolve the right-hand side of a comparison to a value
function resolveValue(node: Record<string, any>): unknown {
	if (node.type === "string") return node.value
	if (node.type === "number") return node.value
	if (node.type === "value" && node.value === true) return true
	if (node.type === "value" && node.value === false) return false
	if (node.type === "value" && node.value === null) return null
	return null
}

// build an EXISTS subquery for value access
// matches the pattern from pub-filters.ts
function buildValueExistsSubquery<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	fieldSlug: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)

	// jsonb values need stringification for string comparisons
	const sqlValue = typeof value === "string" ? JSON.stringify(value) : value

	// use `as any` to bypass kysely's strict generic type inference
	// on dynamically constructed subqueries
	const subquery = (eb as any)
		.selectFrom("pub_values")
		.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
		.select(sql.lit(1).as("exists_check"))
		.where("pub_values.pubId", "=", sql.ref(`${pubRef}.id`))
		.where("pub_fields.slug", "=", fieldSlug)
		.where("pub_values.value", sqlOp, sqlValue)

	return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
}

// build a condition through a relation
function buildRelationCondition<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	relation: string,
	field: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)
	const ebi = eb as any

	// pubType -> join pub_types via pubTypeId
	if (relation === "pubType") {
		const subquery = ebi
			.selectFrom("pub_types")
			.select(sql.lit(1).as("exists_check"))
			.where("pub_types.id", "=", sql.ref(`${pubRef}.pubTypeId`))
			.where(`pub_types.${field}`, sqlOp, value)
		return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
	}

	// stage -> join through PubsInStages to stages
	if (relation === "stage") {
		const subquery = ebi
			.selectFrom("PubsInStages")
			.innerJoin("stages", "stages.id", "PubsInStages.stageId")
			.select(sql.lit(1).as("exists_check"))
			.where("PubsInStages.pubId", "=", sql.ref(`${pubRef}.id`))
			.where(`stages.${field}`, sqlOp, value)
		return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
	}

	// community -> join communities via communityId
	if (relation === "community") {
		const subquery = ebi
			.selectFrom("communities")
			.select(sql.lit(1).as("exists_check"))
			.where("communities.id", "=", sql.ref(`${pubRef}.communityId`))
			.where(`communities.${field}`, sqlOp, value)
		return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
	}

	return eb.val(true) as any
}

// outgoing relation, direct field on the related pub
// out['some-relation'].title = 'X'
// -> EXISTS (select 1 from pub_values join pub_fields join pubs
//    where pub_values.pubId = pubs.id and field slug matches
//    and related pub's field matches)
function buildOutRelationDirectCondition<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	relationSlug: string,
	field: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)
	const subquery = (eb as any)
		.selectFrom("pub_values as pv_rel")
		.innerJoin("pub_fields as pf_rel", "pf_rel.id", "pv_rel.fieldId")
		.innerJoin("pubs as related", "related.id", "pv_rel.relatedPubId")
		.select(sql.lit(1).as("exists_check"))
		.where("pv_rel.pubId", "=", sql.ref(`${pubRef}.id`))
		.where("pf_rel.slug", "=", relationSlug)
		.where(`related.${field}`, sqlOp, value)
	return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
}

// outgoing relation, value access on the related pub
// out['some-relation'].values.Title = 'X'
// -> EXISTS (select 1 from pub_values join pub_fields
//    where pub_values.pubId = pubs.id and field slug matches
//    and EXISTS (select 1 from pub_values join pub_fields
//       where pubId = relatedPubId and nested field slug matches and value matches))
function buildOutRelationValueCondition<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	relationSlug: string,
	valueFieldSlug: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)
	const sqlValue = typeof value === "string" ? JSON.stringify(value) : value

	const innerSubquery = sql`EXISTS (
		SELECT 1 FROM pub_values AS pv_val
		INNER JOIN pub_fields AS pf_val ON pf_val.id = pv_val."fieldId"
		WHERE pv_val."pubId" = pv_rel."relatedPubId"
		AND pf_val.slug = ${valueFieldSlug}
		AND pv_val.value ${sql.raw(sqlOp)} ${sqlValue}
	)`

	const subquery = (eb as any)
		.selectFrom("pub_values as pv_rel")
		.innerJoin("pub_fields as pf_rel", "pf_rel.id", "pv_rel.fieldId")
		.select(sql.lit(1).as("exists_check"))
		.where("pv_rel.pubId", "=", sql.ref(`${pubRef}.id`))
		.where("pf_rel.slug", "=", relationSlug)
		.where(sql.raw(`pv_rel."relatedPubId" IS NOT NULL`))
		.where(innerSubquery)

	return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
}

// incoming relation, direct field on the source pub
// in['some-relation'].title = 'X'
// -> EXISTS (select 1 from pub_values join pub_fields join pubs
//    where pub_values.relatedPubId = pubs.id and field slug matches
//    and source pub's field matches)
function buildInRelationDirectCondition<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	relationSlug: string,
	field: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)
	const subquery = (eb as any)
		.selectFrom("pub_values as pv_rel")
		.innerJoin("pub_fields as pf_rel", "pf_rel.id", "pv_rel.fieldId")
		.innerJoin("pubs as source", "source.id", "pv_rel.pubId")
		.select(sql.lit(1).as("exists_check"))
		.where("pv_rel.relatedPubId", "=", sql.ref(`${pubRef}.id`))
		.where("pf_rel.slug", "=", relationSlug)
		.where(`source.${field}`, sqlOp, value)
	return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
}

// incoming relation, value access on the source pub
// in['some-relation'].values.Title = 'X'
// -> EXISTS (select 1 from pub_values join pub_fields
//    where pub_values.relatedPubId = pubs.id and field slug matches
//    and EXISTS (select 1 from pub_values join pub_fields
//       where pubId = source pubId and nested field slug matches))
function buildInRelationValueCondition<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	relationSlug: string,
	valueFieldSlug: string,
	op: string,
	value: unknown,
	pubRef: string
): ExpressionWrapper<DB, TB, any> {
	const sqlOp = mapOperator(op)
	const sqlValue = typeof value === "string" ? JSON.stringify(value) : value

	const innerSubquery = sql`EXISTS (
		SELECT 1 FROM pub_values AS pv_val
		INNER JOIN pub_fields AS pf_val ON pf_val.id = pv_val."fieldId"
		WHERE pv_val."pubId" = pv_rel."pubId"
		AND pf_val.slug = ${valueFieldSlug}
		AND pv_val.value ${sql.raw(sqlOp)} ${sqlValue}
	)`

	const subquery = (eb as any)
		.selectFrom("pub_values as pv_rel")
		.innerJoin("pub_fields as pf_rel", "pf_rel.id", "pv_rel.fieldId")
		.select(sql.lit(1).as("exists_check"))
		.where("pv_rel.relatedPubId", "=", sql.ref(`${pubRef}.id`))
		.where("pf_rel.slug", "=", relationSlug)
		.where(innerSubquery)

	return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
}

function translateFunctionFilter<DB, TB extends keyof DB>(
	eb: ExpressionBuilder<DB, TB>,
	node: Record<string, any>,
	pubRef: string,
	communitySlug: string
): ExpressionWrapper<DB, TB, any> {
	const funcName = (node.procedure?.value ?? node.value) as string
	const args = (node.arguments ?? []) as Array<Record<string, any>>

	// $contains(path, pattern) -> ILIKE / text search
	if (funcName === "contains" && args.length === 2) {
		const leftPath = resolvePath(args[0])
		const pattern = resolveValue(args[1])
		const ebi = eb as any

		if (leftPath?.type === "value_access" && typeof pattern === "string") {
			const subquery = ebi
				.selectFrom("pub_values")
				.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
				.select(sql.lit(1).as("exists_check"))
				.where("pub_values.pubId", "=", sql.ref(`${pubRef}.id`))
				.where("pub_fields.slug", "=", leftPath.fieldSlug)
				.where(sql.raw(`"pub_values"."value"::text`), "ilike", `%${pattern}%`)
			return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
		}

		if (leftPath?.type === "direct" && typeof pattern === "string") {
			const ref = sql.ref(`${pubRef}.${leftPath.field}`)
			return ebi(ref, "ilike", `%${pattern}%`) as ExpressionWrapper<DB, TB, any>
		}
	}

	// $exists(path) -> IS NOT NULL check
	if (funcName === "exists" && args.length === 1) {
		const leftPath = resolvePath(args[0])
		const ebi = eb as any
		if (leftPath?.type === "direct") {
			const ref = sql.ref(`${pubRef}.${leftPath.field}`)
			return ebi(ref, "is not", null) as ExpressionWrapper<DB, TB, any>
		}
		if (leftPath?.type === "value_access") {
			const subquery = ebi
				.selectFrom("pub_values")
				.innerJoin("pub_fields", "pub_fields.id", "pub_values.fieldId")
				.select(sql.lit(1).as("exists_check"))
				.where("pub_values.pubId", "=", sql.ref(`${pubRef}.id`))
				.where("pub_fields.slug", "=", leftPath.fieldSlug)
				.where("pub_values.value", "is not", null)
			return eb.exists(subquery) as ExpressionWrapper<DB, TB, any>
		}
	}

	// $not(expr) -> NOT
	if (funcName === "not" && args.length === 1) {
		const inner = translateFilterAst(eb, args[0] as ExprNode, pubRef, communitySlug)
		return eb.not(inner) as ExpressionWrapper<DB, TB, any>
	}

	return eb.val(true) as any
}

function mapOperator(op: string): string {
	switch (op) {
		case "=":
			return "="
		case "!=":
			return "!="
		case "<":
			return "<"
		case "<=":
			return "<="
		case ">":
			return ">"
		case ">=":
			return ">="
		case "in":
			return "in"
		default:
			return "="
	}
}
