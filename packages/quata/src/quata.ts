// quata - jsonata to sql translation library
// main factory and api

import type { ExprNode, PathNode, SortNode } from "./jsonata.overrides.js"
import type { QuataSchema, TableSchema } from "./schema/types.js"

import { type Kysely, type RawBuilder, type SelectQueryBuilder, sql } from "kysely"

import { parseExpression } from "./ast-cache.js"
import { normalizeSchema } from "./schema/types.js"
import { validateExpression } from "./subset-validator.js"
import { createContext, generateAlias, type TranslationContext } from "./translator/context.js"
import { resultToSql, TranslationError, translateExpression } from "./translator/expression.js"

// options for creating a quata instance
export interface QuataOptions<TSchema extends QuataSchema> {
	schema: TSchema
	db: Kysely<Record<string, unknown>>
}

// extracted query parts for integration with existing queries
export interface QueryParts {
	// the table name and alias
	table: { name: string; alias: string } | null
	// WHERE conditions as raw sql builders
	filters: RawBuilder<unknown>[]
	// ORDER BY clauses
	orderBy: Array<{ column: string; direction: "asc" | "desc" }>
	// LIMIT value
	limit: number | undefined
	// OFFSET value
	offset: number | undefined
	// projection field expressions (key -> sql expression)
	projection: Array<{ key: string; sql: RawBuilder<unknown> }> | null
	// joins needed for relation traversal
	joins: Array<{
		table: string
		alias: string
		sourceAlias: string
		foreignKey: string
		targetKey: string
	}>
}

// a compiled query ready for execution
export interface CompiledQuery<T = unknown> {
	// the generated sql query string
	sql: string
	// bound parameter values
	parameters: unknown[]
	// execute the query with optional parameters
	execute: (params?: Record<string, unknown>) => Promise<T[]>
	// get the kysely query builder (for further modification)
	toQueryBuilder: () => SelectQueryBuilder<Record<string, unknown>, string, T>
	// get the extracted query parts for integration
	getParts: () => QueryParts
}

// the main quata instance
export interface Quata<TSchema extends QuataSchema> {
	// compile a jsonata expression to sql
	compile: <T = unknown>(expression: string, params?: Record<string, unknown>) => CompiledQuery<T>

	// validate an expression without compiling
	validate: (expression: string) => { valid: boolean; errors: string[] }

	// get the schema
	schema: TSchema
}

// create a new quata instance
// can be called with options object or with schema and db as separate args
export function createQuata<TSchema extends QuataSchema>(
	schemaOrOptions: TSchema | QuataOptions<TSchema>,
	maybeDb?: Kysely<Record<string, unknown>>
): Quata<TSchema> {
	const { schema, db } =
		maybeDb !== undefined
			? { schema: schemaOrOptions as TSchema, db: maybeDb }
			: (schemaOrOptions as QuataOptions<TSchema>)

	// normalize the schema to apply defaults
	const normalizedSchema = normalizeSchema(schema)

	return {
		schema,

		validate(expression: string) {
			const result = validateExpression(expression)
			return {
				valid: result.valid,
				errors: result.errors.map((e) => e.message),
			}
		},

		compile<T = unknown>(
			expression: string,
			params?: Record<string, unknown>
		): CompiledQuery<T> {
			// parse the expression to ast (cached)
			const ast = parseExpression(expression)

			// validate the ast
			const validation = validateExpression(expression)
			if (!validation.valid) {
				throw new Error(
					`invalid expression: ${validation.errors.map((e) => e.message).join(", ")}`
				)
			}

			// create translation context
			const ctx = createContext({
				schema: normalizedSchema,
				parameters: params ?? {},
				db,
			})

			// translate the ast to a query
			const query = buildQuery(ast, ctx)

			// compile to sql
			const compiled = query.compile()

			// extract query parts for integration
			const extractParts = (): QueryParts => {
				const partsCtx = createContext({
					schema: normalizedSchema,
					parameters: params ?? {},
					db,
				})
				return extractQueryParts(ast, partsCtx)
			}

			return {
				sql: compiled.sql,
				parameters: compiled.parameters as unknown[],
				getParts: extractParts,
				execute: async (runtimeParams?: Record<string, unknown>) => {
					if (runtimeParams) {
						// merge runtime params with compile-time params
						const mergedParams = { ...params, ...runtimeParams }
						const ctx2 = createContext({
							schema: normalizedSchema,
							parameters: mergedParams,
							db,
						})
						const query2 = buildQuery(ast, ctx2)
						const result = await query2.execute()
						return result as T[]
					}
					const result = await query.execute()
					return result as T[]
				},
				toQueryBuilder: () =>
					query as SelectQueryBuilder<Record<string, unknown>, string, T>,
			}
		},
	}
}

// build a kysely query from the ast
function buildQuery(
	ast: ExprNode,
	ctx: TranslationContext
): SelectQueryBuilder<Record<string, unknown>, string, unknown> {
	// handle $$table expressions (variable node with predicate)
	if (ast.type === "variable") {
		const varNode = ast as unknown as {
			value: string
			predicate?: Array<{ type: string; expr?: ExprNode }>
		}

		if (varNode.value.startsWith("$")) {
			const tableName = varNode.value.slice(1)
			const tableSchema = ctx.schema.tables[tableName]
			if (!tableSchema) {
				throw new TranslationError(`unknown table: ${tableName}`, ast, ctx)
			}

			const tableAlias = generateAlias(ctx)
			ctx.currentTable = tableName
			ctx.currentTableAlias = tableAlias

			let query = ctx.db.selectFrom(`${tableSchema.table} as ${tableAlias}`)
			query = query.selectAll() as typeof query

			// collect filter conditions first (to gather pending joins)
			const filterConditions: RawBuilder<unknown>[] = []
			let limitValue: number | undefined
			let offsetValue: number | undefined

			// save original table context
			const originalTable = ctx.currentTable
			const originalAlias = ctx.currentTableAlias

			if (varNode.predicate) {
				for (const pred of varNode.predicate) {
					if (pred.type === "filter" && pred.expr) {
						if (pred.expr.type === "number") {
							// direct index access: [0]
							const idx = (pred.expr as unknown as { value: number }).value
							limitValue = 1
							if (idx > 0) {
								offsetValue = idx
							}
						} else if (pred.expr.type === "unary") {
							// check for range syntax: [[0..2]]
							const unaryExpr = pred.expr as unknown as {
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
									limitValue = end - start + 1
									if (start > 0) {
										offsetValue = start
									}
								}
							}
						} else {
							// regular filter condition - translate it (may add pending joins)
							// restore table context before each filter to ensure relation paths
							// start from the base table
							ctx.currentTable = originalTable
							ctx.currentTableAlias = originalAlias
							const result = translateExpression(pred.expr, ctx)
							filterConditions.push(resultToSql(result, ctx))
						}
					}
				}
			}

			// restore original table context after processing filters
			ctx.currentTable = originalTable
			ctx.currentTableAlias = originalAlias

			// apply pending joins (from relation traversal in filters)
			for (const [, join] of ctx.pendingJoins) {
				const targetTable = ctx.schema.tables[join.targetTableName]
				if (!targetTable) continue

				query = (
					query as SelectQueryBuilder<Record<string, unknown>, string, unknown>
				).leftJoin(
					`${targetTable.table} as ${join.targetAlias}` as never,
					`${join.sourceAlias}.${join.relation.foreignKey}` as never,
					`${join.targetAlias}.${join.relation.targetKey}` as never
				) as typeof query
			}

			// apply filter conditions
			for (const condition of filterConditions) {
				query = query.where(condition as never) as typeof query
			}

			// apply limit/offset
			if (limitValue !== undefined) {
				query = query.limit(limitValue) as typeof query
			}
			if (offsetValue !== undefined) {
				query = query.offset(offsetValue) as typeof query
			}

			return query as SelectQueryBuilder<Record<string, unknown>, string, unknown>
		}
	}

	// the root expression should be a path for most cases
	if (ast.type !== "path") {
		throw new TranslationError("query must start with a path expression", ast, ctx)
	}

	const pathNode = ast as unknown as PathNode

	// find the table reference and build the query
	const { tableName, tableAlias, whereConditions, orderBy, limit, offset, projection } =
		analyzePathExpression(pathNode, ctx)

	if (!tableName) {
		throw new TranslationError("could not determine table from expression", ast, ctx)
	}

	const tableSchema = ctx.schema.tables[tableName]
	if (!tableSchema) {
		throw new TranslationError(`unknown table: ${tableName}`, ast, ctx)
	}

	// update context with table info
	ctx.currentTable = tableName
	ctx.currentTableAlias = tableAlias

	// start building the query
	let query = ctx.db.selectFrom(
		tableAlias ? `${tableSchema.table} as ${tableAlias}` : tableSchema.table
	)

	// apply projection (SELECT clause)
	if (projection) {
		query = applyProjection(query, projection, ctx) as typeof query
	} else {
		query = query.selectAll() as typeof query
	}

	// apply pending joins (from relation traversal)
	for (const [, join] of ctx.pendingJoins) {
		const targetTable = ctx.schema.tables[join.targetTableName]
		if (!targetTable) continue

		query = (query as SelectQueryBuilder<Record<string, unknown>, string, unknown>).leftJoin(
			`${targetTable.table} as ${join.targetAlias}` as never,
			`${join.sourceAlias}.${join.relation.foreignKey}` as never,
			`${join.targetAlias}.${join.relation.targetKey}` as never
		) as typeof query
	}

	// apply WHERE conditions
	for (const condition of whereConditions) {
		query = query.where(condition as never) as typeof query
	}

	// apply ORDER BY
	for (const order of orderBy) {
		query = query.orderBy(sql.ref(order.column), order.direction) as typeof query
	}

	// apply LIMIT/OFFSET
	if (limit !== undefined) {
		query = query.limit(limit) as typeof query
	}
	if (offset !== undefined) {
		query = query.offset(offset) as typeof query
	}

	return query as SelectQueryBuilder<Record<string, unknown>, string, unknown>
}

// analyze a path expression to extract query components
function analyzePathExpression(
	pathNode: PathNode,
	ctx: TranslationContext
): {
	tableName: string | null
	tableAlias: string | null
	whereConditions: RawBuilder<unknown>[]
	orderBy: Array<{ column: string; direction: "asc" | "desc" }>
	limit: number | undefined
	offset: number | undefined
	projection: Array<[string, ExprNode]> | null
} {
	let tableName: string | null = null
	let tableAlias: string | null = null
	const whereConditions: RawBuilder<unknown>[] = []
	const orderBy: Array<{ column: string; direction: "asc" | "desc" }> = []
	let limit: number | undefined
	let offset: number | undefined
	let projection: Array<[string, ExprNode]> | null = null

	const steps = pathNode.steps

	for (let i = 0; i < steps.length; i++) {
		const step = steps[i]

		// check for $$ (root reference to table)
		// in jsonata, $$tableName parses as variable "$tableName"
		if (step.type === "variable") {
			const varValue = (step as unknown as { value: string }).value
			if (varValue.startsWith("$")) {
				// $$tableName parses as "$tableName"
				tableName = varValue.slice(1)
				tableAlias = generateAlias(ctx)

				// check for predicate array (filters attached to the variable)
				const varWithPredicate = step as unknown as {
					predicate?: Array<{ type: string; expr?: ExprNode }>
				}
				if (varWithPredicate.predicate) {
					// update context before processing filters
					ctx.currentTable = tableName
					ctx.currentTableAlias = tableAlias

					for (const pred of varWithPredicate.predicate) {
						if (pred.type === "filter" && pred.expr) {
							if (pred.expr.type === "number") {
								const idx = (pred.expr as unknown as { value: number }).value
								if (idx >= 0) {
									limit = 1
									offset = idx
								}
							} else if (pred.expr.type === "unary") {
								const unaryExpr = pred.expr as unknown as {
									value: string
									expressions?: ExprNode[]
								}
								if (
									unaryExpr.value === "[" &&
									unaryExpr.expressions?.length === 1
								) {
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
								// regular filter condition - restore context before each filter
								ctx.currentTable = tableName
								ctx.currentTableAlias = tableAlias
								const conditionResult = translateExpression(pred.expr, ctx)
								whereConditions.push(resultToSql(conditionResult, ctx))
								// restore context after filter (relation traversal may have changed it)
								ctx.currentTable = tableName
								ctx.currentTableAlias = tableAlias
							}
						}
					}
				}
			} else if (varValue === "") {
				// old pattern: $$ followed by name
				const nextStep = steps[i + 1]
				if (nextStep && nextStep.type === "name") {
					tableName = (nextStep as unknown as { value: string }).value
					tableAlias = generateAlias(ctx)
					i++
				}
			}
			continue
		}

		// check for name that could be a table reference (if we don't have one yet)
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
					// check if it's an index (number) for LIMIT
					if (stage.expr.type === "number") {
						const idx = (stage.expr as unknown as { value: number }).value
						if (idx >= 0) {
							limit = 1
							offset = idx
						} else {
							// negative index - need ORDER BY DESC and LIMIT 1
							limit = 1
							// this would need default ordering which we'll handle later
						}
					} else if (stage.expr.type === "unary") {
						// check for range expression [[0..9]]
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
								limit = end - start + 1 // inclusive range
								offset = start
							}
						}
					} else {
						// regular filter condition - set up context and translate
						const filterCtx = {
							...ctx,
							currentTable: tableName,
							currentTableAlias: tableAlias,
						}
						const conditionResult = translateExpression(stage.expr, filterCtx)
						whereConditions.push(resultToSql(conditionResult, filterCtx))
					}
				}
			}
		}

		// check for sort expression
		if (step.type === "sort") {
			// ensure context is set to main table for sort expressions
			if (tableName && tableAlias) {
				ctx.currentTable = tableName
				ctx.currentTableAlias = tableAlias
			}
			const sortNode = step as unknown as SortNode
			for (const term of sortNode.terms) {
				const exprResult = translateExpression(term.expression, ctx)
				if (exprResult.type === "reference") {
					orderBy.push({
						column: exprResult.tableAlias
							? `${exprResult.tableAlias}.${exprResult.column}`
							: exprResult.column,
						direction: term.descending ? "desc" : "asc",
					})
				}
			}

			// check for filter stages on the sort node (for limit after sort)
			const sortWithStages = step as unknown as {
				stages?: Array<{ type: string; expr?: ExprNode }>
			}
			if (sortWithStages.stages) {
				for (const stage of sortWithStages.stages) {
					if (stage.type === "filter" && stage.expr) {
						if (stage.expr.type === "number") {
							const idx = (stage.expr as unknown as { value: number }).value
							limit = 1
							offset = idx >= 0 ? idx : undefined
						}
					}
				}
			}
		}

		// check for object constructor (projection)
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

		// check for block expression (variable binding in projection context)
		if (step.type === "block") {
			const blockNode = step as unknown as { expressions: ExprNode[] }
			// find the projection in the block (last expression should be an object)
			for (const expr of blockNode.expressions) {
				if (expr.type === "bind") {
					// handle variable binding ($this := $)
					const bindNode = expr as unknown as {
						lhs: { value: string }
						rhs: ExprNode
					}
					const varName = bindNode.lhs.value
					if (bindNode.rhs.type === "variable") {
						const rhsVar = (bindNode.rhs as unknown as { value: string }).value
						if (rhsVar === "") {
							// $this := $ - bind current context
							ctx.bindings.set(varName, {
								ref: sql.ref(tableAlias ?? tableName ?? ""),
								tableAlias: tableAlias ?? undefined,
							})
						}
					}
				} else if (expr.type === "unary") {
					const unaryNode = expr as unknown as {
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
		}
	}

	return { tableName, tableAlias, whereConditions, orderBy, limit, offset, projection }
}

// apply projection to the query
function applyProjection(
	query: SelectQueryBuilder<Record<string, unknown>, string, unknown>,
	projection: Array<[string, ExprNode]>,
	ctx: TranslationContext
): SelectQueryBuilder<Record<string, unknown>, string, unknown> {
	const selections: Array<ReturnType<typeof sql.raw>> = []

	// save original table context - need to restore before each projection field
	// since relation traversal modifies the context
	const originalTable = ctx.currentTable
	const originalAlias = ctx.currentTableAlias

	for (const [alias, valueExpr] of projection) {
		// restore context before each projection field so relation lookups
		// start from the main table
		ctx.currentTable = originalTable
		ctx.currentTableAlias = originalAlias

		const result = translateExpression(valueExpr, ctx)
		const sqlExpr = resultToSql(result, ctx)

		// compile the expression and create a raw selection with alias
		const compiled = sqlExpr.compile(ctx.db)
		selections.push(sql.raw(`${compiled.sql} as "${alias}"`))
	}

	// restore context after all projections
	ctx.currentTable = originalTable
	ctx.currentTableAlias = originalAlias

	// apply all selections
	let q = query
	for (const selection of selections) {
		q = q.select(selection as never) as typeof query
	}

	return q
}

// extract query parts without building the full query
// useful for integrating filters/ordering into existing queries
function extractQueryParts(ast: ExprNode, ctx: TranslationContext): QueryParts {
	// handle $$table expressions
	if (ast.type === "variable") {
		const varNode = ast as unknown as {
			value: string
			predicate?: Array<{ type: string; expr?: ExprNode }>
		}

		if (varNode.value.startsWith("$")) {
			const tableName = varNode.value.slice(1)
			const tableSchema = ctx.schema.tables[tableName]
			if (!tableSchema) {
				return {
					table: null,
					filters: [],
					orderBy: [],
					limit: undefined,
					offset: undefined,
					projection: null,
					joins: [],
				}
			}

			const tableAlias = generateAlias(ctx)
			ctx.currentTable = tableName
			ctx.currentTableAlias = tableAlias

			const filters: RawBuilder<unknown>[] = []
			let limitValue: number | undefined
			let offsetValue: number | undefined

			const originalTable = ctx.currentTable
			const originalAlias = ctx.currentTableAlias

			if (varNode.predicate) {
				for (const pred of varNode.predicate) {
					if (pred.type === "filter" && pred.expr) {
						if (pred.expr.type === "number") {
							const idx = (pred.expr as unknown as { value: number }).value
							limitValue = 1
							if (idx > 0) offsetValue = idx
						} else if (pred.expr.type === "unary") {
							const unaryExpr = pred.expr as unknown as {
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
									limitValue = end - start + 1
									if (start > 0) offsetValue = start
								}
							}
						} else {
							ctx.currentTable = originalTable
							ctx.currentTableAlias = originalAlias
							const result = translateExpression(pred.expr, ctx)
							filters.push(resultToSql(result, ctx))
						}
					}
				}
			}

			ctx.currentTable = originalTable
			ctx.currentTableAlias = originalAlias

			// collect joins
			const joins = Array.from(ctx.pendingJoins.values()).map((j) => {
				const targetTable = ctx.schema.tables[j.targetTableName]
				return {
					table: targetTable?.table ?? j.targetTableName,
					alias: j.targetAlias,
					sourceAlias: j.sourceAlias,
					foreignKey: j.relation.foreignKey,
					targetKey: j.relation.targetKey,
				}
			})

			return {
				table: { name: tableSchema.table, alias: tableAlias },
				filters,
				orderBy: [],
				limit: limitValue,
				offset: offsetValue,
				projection: null,
				joins,
			}
		}
	}

	// handle path expressions
	if (ast.type === "path") {
		const pathNode = ast as unknown as PathNode
		const analysis = analyzePathExpression(pathNode, ctx)

		if (!analysis.tableName) {
			return {
				table: null,
				filters: [],
				orderBy: [],
				limit: undefined,
				offset: undefined,
				projection: null,
				joins: [],
			}
		}

		const tableSchema = ctx.schema.tables[analysis.tableName]

		// update context for projection extraction
		ctx.currentTable = analysis.tableName
		ctx.currentTableAlias = analysis.tableAlias

		// extract projection expressions
		let projectionParts: Array<{ key: string; sql: RawBuilder<unknown> }> | null = null
		if (analysis.projection) {
			const originalTable = ctx.currentTable
			const originalAlias = ctx.currentTableAlias
			projectionParts = []

			for (const [key, valueExpr] of analysis.projection) {
				ctx.currentTable = originalTable
				ctx.currentTableAlias = originalAlias
				const result = translateExpression(valueExpr, ctx)
				projectionParts.push({ key, sql: resultToSql(result, ctx) })
			}

			ctx.currentTable = originalTable
			ctx.currentTableAlias = originalAlias
		}

		// collect joins
		const joins = Array.from(ctx.pendingJoins.values()).map((j) => {
			const targetTable = ctx.schema.tables[j.targetTableName]
			return {
				table: targetTable?.table ?? j.targetTableName,
				alias: j.targetAlias,
				sourceAlias: j.sourceAlias,
				foreignKey: j.relation.foreignKey,
				targetKey: j.relation.targetKey,
			}
		})

		return {
			table: tableSchema
				? { name: tableSchema.table, alias: analysis.tableAlias ?? "t0" }
				: null,
			filters: analysis.whereConditions,
			orderBy: analysis.orderBy,
			limit: analysis.limit,
			offset: analysis.offset,
			projection: projectionParts,
			joins,
		}
	}

	// fallback for other ast types
	return {
		table: null,
		filters: [],
		orderBy: [],
		limit: undefined,
		offset: undefined,
		projection: null,
		joins: [],
	}
}

// re-export types and utilities
export { TranslationError }
export type { QuataSchema, TableSchema, TranslationContext }
