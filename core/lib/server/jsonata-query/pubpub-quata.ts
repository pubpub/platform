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

	// value access pattern: values[field.slug = '...'].value
	if (leftPath.type === "value_access") {
		return buildValueExistsSubquery(eb, leftPath.fieldSlug, op, rightValue, pubRef)
	}

	// relation path: pubType.name, stage.name, etc.
	if (leftPath.type === "relation") {
		return buildRelationCondition(eb, leftPath.relation, leftPath.field, op, rightValue, pubRef)
	}

	// direct field on pubs table
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

	return eb.val(true) as any
}

type ResolvedPath =
	| { type: "direct"; field: string }
	| { type: "value_access"; fieldSlug: string }
	| { type: "relation"; relation: string; field: string }

// resolve a path expression to understand what it references
function resolvePath(node: Record<string, any>): ResolvedPath | null {
	console.dir(node, { depth: null })
	// simple name node: title, createdAt, etc.
	if (node.type === "name") {
		const name = node.value as string
		if (DIRECT_PUB_FIELDS.has(name)) {
			return { type: "direct", field: name }
		}
		return null
	}

	// path expression: pubType.name, values[...].value, stage.name
	if (node.type === "path") {
		const steps = node.steps as Array<Record<string, any>>
		if (steps.length === 0) return null

		const firstName = steps[0]?.value as string | undefined
		if (!firstName) return null

		// detect values[field.slug = '...'].value pattern
		// this is what expandShorthands produces from values.fieldSlug
		// jsonata stores filters as "stages" on name nodes inside paths
		if (firstName === "values" && (steps[0]?.stages || steps[0]?.predicate)) {
			const filterSource = steps[0].stages ?? steps[0].predicate
			const fieldSlug = extractFieldSlugFromPredicate(filterSource)
			if (fieldSlug) {
				return { type: "value_access", fieldSlug }
			}
		}

		// detect relation paths like pubType.name, stage.name
		if (steps.length === 2 && steps[1]?.type === "name") {
			const relationName = firstName
			const fieldName = steps[1].value as string

			if (DIRECT_PUB_FIELDS.has(relationName)) {
				// something like id.something - not a relation
				return null
			}

			return { type: "relation", relation: relationName, field: fieldName }
		}

		// single step path that's a direct field
		if (steps.length === 1 && DIRECT_PUB_FIELDS.has(firstName)) {
			return { type: "direct", field: firstName }
		}
	}

	// variable reference like $.field (in projection context)
	if (node.type === "variable" && node.value === "") {
		// $ by itself, check for stages
		return null
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
