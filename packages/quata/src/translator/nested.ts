// nested query handling for quata
// handles scalar subqueries, correlated subqueries, and jsonArrayFrom patterns

import type { ExprNode, PathNode } from "../jsonata.overrides.js"
import type { TranslationContext } from "./context.js"

import { type RawBuilder, type SelectQueryBuilder, sql } from "kysely"

import { createChildContext, generateAlias } from "./context.js"
import {
	resultToSql,
	TranslationError,
	type TranslationResult,
	translateExpression,
} from "./expression.js"

// detect if an expression contains aggregate functions that need subquery wrapping
export function containsAggregate(node: ExprNode): boolean {
	if (node.type === "function") {
		const funcNode = node as unknown as { procedure: { value: string } }
		const funcName = funcNode.procedure.value
		if (["sum", "count", "average", "min", "max"].includes(funcName)) {
			return true
		}
	}

	// recursively check children
	const nodeAny = node as unknown as Record<string, unknown>

	for (const key of Object.keys(nodeAny)) {
		const value = nodeAny[key]
		if (value && typeof value === "object") {
			if (Array.isArray(value)) {
				for (const item of value) {
					if (item && typeof item === "object" && "type" in item) {
						if (containsAggregate(item as ExprNode)) {
							return true
						}
					}
				}
			} else if ("type" in value) {
				if (containsAggregate(value as ExprNode)) {
					return true
				}
			}
		}
	}

	return false
}

// detect if an expression is a nested query (path starting with $$)
// in jsonata, $$tableName parses as a variable with value "$tableName"
export function isNestedQuery(node: ExprNode): boolean {
	if (node.type === "path") {
		const pathNode = node as unknown as PathNode
		if (!pathNode.steps || pathNode.steps.length === 0) {
			return false
		}

		const firstStep = pathNode.steps[0]
		if (firstStep.type !== "variable") {
			return false
		}

		const varValue = (firstStep as unknown as { value: string }).value
		// $$ followed by tableName parses as variable "$tableName"
		return varValue.startsWith("$")
	}

	// $$items[filter] without projection parses as variable node (not path)
	if (node.type === "variable") {
		const varValue = (node as unknown as { value: string }).value
		return varValue.startsWith("$")
	}

	return false
}

// extract table name from a $$ variable reference
export function extractTableFromVariable(varValue: string): string | null {
	if (varValue.startsWith("$")) {
		return varValue.slice(1) // remove the $ prefix
	}
	return null
}

// build a nested query as a subquery
// handles both path nodes and variable nodes ($$items[filter])
export function buildNestedQuery(
	node: PathNode | ExprNode,
	ctx: TranslationContext
): TranslationResult {
	// create a child context for the nested query
	const childCtx = createChildContext(ctx)

	let tableName: string | null = null
	let tableAlias: string | null = null
	let conditions: RawBuilder<unknown>[] = []
	let sortTerms: Array<{ column: string; direction: "asc" | "desc" }> = []
	let limit: number | undefined
	let offset: number | undefined
	let projection: Array<[string, ExprNode]> | null = null

	// handle variable node with predicate ($$items[filter])
	if (node.type === "variable") {
		const varNode = node as unknown as {
			value: string
			predicate?: Array<{ type: string; expr?: ExprNode }>
		}

		if (varNode.value.startsWith("$")) {
			tableName = varNode.value.slice(1)
			tableAlias = generateAlias(childCtx)

			// process predicates as filters
			if (varNode.predicate) {
				childCtx.currentTable = tableName
				childCtx.currentTableAlias = tableAlias

				for (const pred of varNode.predicate) {
					if (pred.type === "filter" && pred.expr) {
						if (pred.expr.type === "number") {
							const idx = (pred.expr as unknown as { value: number }).value
							if (idx >= 0) {
								limit = 1
								offset = idx
							}
						} else {
							const result = translateExpression(pred.expr, childCtx)
							conditions.push(resultToSql(result, childCtx))
						}
					}
				}
			}
		}
	} else if (node.type === "path") {
		// extract table name and conditions from the path
		const pathNode = node as PathNode
		const analyzed = analyzeNestedPath(pathNode, childCtx)
		tableName = analyzed.tableName
		tableAlias = analyzed.tableAlias
		conditions = analyzed.conditions
		sortTerms = analyzed.sortTerms
		limit = analyzed.limit
		offset = analyzed.offset
		projection = analyzed.projection
	}

	if (!tableName) {
		throw new TranslationError(
			"could not determine table for nested query",
			node as unknown as ExprNode,
			ctx
		)
	}

	const tableSchema = ctx.schema.tables[tableName]
	if (!tableSchema) {
		throw new TranslationError(
			`unknown table in nested query: ${tableName}`,
			node as unknown as ExprNode,
			ctx
		)
	}

	// update child context
	childCtx.currentTable = tableName
	childCtx.currentTableAlias = tableAlias

	// build the subquery
	let subquery = ctx.db.selectFrom(
		tableAlias ? `${tableSchema.table} as ${tableAlias}` : tableSchema.table
	)

	// apply projection or select all
	if (projection) {
		for (const [alias, valueExpr] of projection) {
			const result = translateExpression(valueExpr, childCtx)
			const sqlExpr = resultToSql(result, childCtx)
			const compiled = sqlExpr.compile(ctx.db)
			subquery = subquery.select(
				sql.raw(`${compiled.sql} as "${alias}"`) as never
			) as typeof subquery
		}
	} else {
		subquery = subquery.selectAll() as typeof subquery
	}

	// apply WHERE conditions
	for (const condition of conditions) {
		subquery = subquery.where(condition as never) as typeof subquery
	}

	// apply ORDER BY
	for (const term of sortTerms) {
		subquery = subquery.orderBy(sql.ref(term.column), term.direction) as typeof subquery
	}

	// apply LIMIT/OFFSET
	if (limit !== undefined) {
		subquery = subquery.limit(limit) as typeof subquery
	}
	if (offset !== undefined) {
		subquery = subquery.offset(offset) as typeof subquery
	}

	return {
		type: "query",
		value: subquery as SelectQueryBuilder<Record<string, unknown>, string, unknown>,
	}
}

// analyze a nested path expression
function analyzeNestedPath(
	pathNode: PathNode,
	ctx: TranslationContext
): {
	tableName: string | null
	tableAlias: string | null
	conditions: RawBuilder<unknown>[]
	sortTerms: Array<{ column: string; direction: "asc" | "desc" }>
	limit: number | undefined
	offset: number | undefined
	projection: Array<[string, ExprNode]> | null
} {
	let tableName: string | null = null
	let tableAlias: string | null = null
	const conditions: RawBuilder<unknown>[] = []
	const sortTerms: Array<{ column: string; direction: "asc" | "desc" }> = []
	let limit: number | undefined
	let offset: number | undefined
	let projection: Array<[string, ExprNode]> | null = null

	const steps = pathNode.steps

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i]

		// $$ variable reference - in jsonata, $$tableName parses as variable "$tableName"
		if (step.type === "variable") {
			const varValue = (step as unknown as { value: string }).value
			if (varValue.startsWith("$")) {
				// $$tableName parses as "$tableName", so extract the table name
				tableName = varValue.slice(1)
				tableAlias = generateAlias(ctx)
			} else if (varValue === "") {
				// next step should be the table name (old pattern)
				const nextStep = steps[i + 1]
				if (nextStep && nextStep.type === "name") {
					tableName = (nextStep as unknown as { value: string }).value
					tableAlias = generateAlias(ctx)
					i++
				}
			}
			continue
		}

		// name that could be a table reference
		if (step.type === "name" && !tableName) {
			const nameValue = (step as unknown as { value: string }).value
			if (ctx.schema.tables[nameValue]) {
				tableName = nameValue
				tableAlias = generateAlias(ctx)
			}
		}

		// check for filter stages
		const stepWithStages = step as unknown as {
			stages?: Array<{ type: string; expr?: ExprNode }>
		}

		if (stepWithStages.stages) {
			for (const stage of stepWithStages.stages) {
				if (stage.type === "filter" && stage.expr) {
					if (stage.expr.type === "number") {
						const idx = (stage.expr as unknown as { value: number }).value
						if (idx >= 0) {
							limit = 1
							offset = idx
						}
					} else if (stage.expr.type === "unary") {
						const unaryExpr = stage.expr as unknown as {
							value: string
							expressions?: ExprNode[]
						}
						if (unaryExpr.value === "[" && unaryExpr.expressions?.length === 1) {
							const rangeExpr = unaryExpr.expressions[0] as unknown as {
								type: string
								value: string
								lhs?: { value: number }
								rhs?: { value: number }
							}
							if (rangeExpr.type === "binary" && rangeExpr.value === "..") {
								const start = rangeExpr.lhs?.value ?? 0
								const end = rangeExpr.rhs?.value ?? 0
								limit = end - start + 1
								offset = start
							}
						}
					} else {
						// regular filter - translate with context
						const filterCtx = {
							...ctx,
							currentTable: tableName,
							currentTableAlias: tableAlias,
						}
						const result = translateExpression(stage.expr, filterCtx)
						conditions.push(resultToSql(result, filterCtx))
					}
				}
			}
		}

		// sort expression
		if (step.type === "sort") {
			const sortNode = step as unknown as {
				terms: Array<{ descending: boolean; expression: ExprNode }>
				stages?: Array<{ type: string; expr?: ExprNode }>
			}

			for (const term of sortNode.terms) {
				const exprResult = translateExpression(term.expression, ctx)
				if (exprResult.type === "reference") {
					sortTerms.push({
						column: exprResult.tableAlias
							? `${exprResult.tableAlias}.${exprResult.column}`
							: exprResult.column,
						direction: term.descending ? "desc" : "asc",
					})
				}
			}

			// check for filter stages on sort
			if (sortNode.stages) {
				for (const stage of sortNode.stages) {
					if (stage.type === "filter" && stage.expr?.type === "number") {
						const idx = (stage.expr as unknown as { value: number }).value
						limit = 1
						offset = idx >= 0 ? idx : undefined
					}
				}
			}
		}

		// projection
		if (step.type === "unary") {
			const unaryNode = step as unknown as {
				value: string
				lhs?: Array<[ExprNode, ExprNode]>
			}
			if (unaryNode.value === "{" && unaryNode.lhs) {
				projection = unaryNode.lhs.map(([keyNode, valueNode]) => {
					const key =
						keyNode.type === "string"
							? ((keyNode as unknown as { value: string }).value as string)
							: String((keyNode as unknown as { value: unknown }).value)
					return [key, valueNode] as [string, ExprNode]
				})
			}
		}
	}

	return { tableName, tableAlias, conditions, sortTerms, limit, offset, projection }
}

// wrap an aggregate function call in a subquery
export function wrapAggregateInSubquery(
	funcName: string,
	args: TranslationResult[],
	ctx: TranslationContext
): TranslationResult {
	// for simple aggregates like $average(items.price)
	// we need to find the table reference and build a subquery

	// check if the first argument is a path that we can extract a table from
	// for now, just build a simple aggregate expression
	const aggFuncs: Record<string, string> = {
		sum: "SUM",
		count: "COUNT",
		average: "AVG",
		min: "MIN",
		max: "MAX",
	}

	const sqlFunc = aggFuncs[funcName]
	if (!sqlFunc) {
		throw new TranslationError(
			`unknown aggregate function: ${funcName}`,
			{ type: "function" } as ExprNode,
			ctx
		)
	}

	if (args.length === 0) {
		if (funcName === "count") {
			return { type: "expression", value: sql`COUNT(*)` }
		}
		throw new TranslationError(
			`${funcName} requires at least one argument`,
			{ type: "function" } as ExprNode,
			ctx
		)
	}

	const argSql = resultToSql(args[0], ctx)
	return { type: "expression", value: sql.raw(`${sqlFunc}(${argSql.compile(ctx.db).sql})`) }
}

// build a scalar subquery for an aggregate
export function buildScalarSubquery(node: ExprNode, ctx: TranslationContext): RawBuilder<unknown> {
	// if node is a function call with aggregate, and its argument is a path
	// build SELECT AGG(col) FROM table WHERE ...
	const funcNode = node as unknown as {
		type: "function"
		procedure: { value: string }
		arguments: ExprNode[]
	}

	const funcName = funcNode.procedure.value
	const aggFuncs: Record<string, string> = {
		sum: "SUM",
		count: "COUNT",
		average: "AVG",
		min: "MIN",
		max: "MAX",
	}

	const sqlFunc = aggFuncs[funcName]
	if (!sqlFunc) {
		// not an aggregate, translate normally
		const result = translateExpression(node, ctx)
		return resultToSql(result, ctx)
	}

	// check if argument is a path expression
	if (funcNode.arguments.length === 0) {
		return sql`(SELECT COUNT(*))`
	}

	const argNode = funcNode.arguments[0]
	if (argNode.type === "path") {
		const pathNode = argNode as unknown as PathNode
		const { tableName, tableAlias, conditions, column } = extractPathInfo(pathNode, ctx)

		if (tableName) {
			const tableSchema = ctx.schema.tables[tableName]
			if (tableSchema) {
				const tableSql = tableSchema.table
				const alias = tableAlias ?? generateAlias(ctx)
				const colRef = column ? `"${alias}"."${column}"` : `"${alias}".*`

				let query = sql.raw(`SELECT ${sqlFunc}(${colRef}) FROM "${tableSql}" AS "${alias}"`)

				if (conditions.length > 0) {
					const whereClauses = conditions.map((c) => c.compile(ctx.db).sql).join(" AND ")
					query = sql.raw(`${query.compile(ctx.db).sql} WHERE ${whereClauses}`)
				}

				return sql`(${query})`
			}
		}
	}

	// fallback to simple aggregate
	const result = translateExpression(argNode, ctx)
	const argSql = resultToSql(result, ctx)
	return sql.raw(`${sqlFunc}(${argSql.compile(ctx.db).sql})`)
}

// extract table and column info from a path
function extractPathInfo(
	pathNode: PathNode,
	ctx: TranslationContext
): {
	tableName: string | null
	tableAlias: string | null
	conditions: RawBuilder<unknown>[]
	column: string | null
} {
	let tableName: string | null = null
	let tableAlias: string | null = null
	const conditions: RawBuilder<unknown>[] = []
	let column: string | null = null

	const steps = pathNode.steps

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i]

		if (step.type === "variable") {
			const varValue = (step as unknown as { value: string }).value
			if (varValue.startsWith("$")) {
				// $$tableName parses as "$tableName"
				tableName = varValue.slice(1)
				tableAlias = generateAlias(ctx)
			} else if (varValue === "") {
				const nextStep = steps[i + 1]
				if (nextStep && nextStep.type === "name") {
					tableName = (nextStep as unknown as { value: string }).value
					tableAlias = generateAlias(ctx)
					i++
				}
			}
			continue
		}

		if (step.type === "name") {
			const nameValue = (step as unknown as { value: string }).value
			if (!tableName && ctx.schema.tables[nameValue]) {
				tableName = nameValue
				tableAlias = generateAlias(ctx)
			} else if (tableName) {
				// this is a field reference
				const tableSchema = ctx.schema.tables[tableName]
				if (tableSchema && tableSchema.fields[nameValue]) {
					column = tableSchema.fields[nameValue].column
				} else {
					column = nameValue
				}
			}
		}

		// check for filter stages
		const stepWithStages = step as unknown as {
			stages?: Array<{ type: string; expr?: ExprNode }>
		}

		if (stepWithStages.stages) {
			for (const stage of stepWithStages.stages) {
				if (stage.type === "filter" && stage.expr && stage.expr.type !== "number") {
					const filterCtx = {
						...ctx,
						currentTable: tableName,
						currentTableAlias: tableAlias,
					}
					const result = translateExpression(stage.expr, filterCtx)
					conditions.push(resultToSql(result, filterCtx))
				}
			}
		}
	}

	return { tableName, tableAlias, conditions, column }
}

// build a json_agg subquery for array results in projections
export function buildJsonArraySubquery(
	pathNode: PathNode,
	ctx: TranslationContext
): RawBuilder<unknown> {
	const result = buildNestedQuery(pathNode, ctx)

	if (result.type !== "query") {
		throw new TranslationError(
			"expected query result for json array subquery",
			pathNode as unknown as ExprNode,
			ctx
		)
	}

	const subquery = result.value
	const compiled = subquery.compile()

	// wrap in json_agg with COALESCE for empty results
	return sql.raw(`COALESCE((SELECT json_agg(sub.*) FROM (${compiled.sql}) AS sub), '[]'::json)`)
}
