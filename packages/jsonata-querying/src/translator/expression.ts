// main expression translator - converts jsonata ast nodes to kysely expressions

import type { ExprNode, PathNode } from "../jsonata.overrides.js"
import type { TranslationContext } from "./context.js"

import { type Expression, type RawBuilder, type SelectQueryBuilder, sql } from "kysely"

import { resolveRelation } from "./context.js"
import {
	buildJsonArraySubquery,
	buildNestedQuery,
	buildScalarSubquery,
	isNestedQuery,
} from "./nested.js"

// the result of translating an expression can be different types
// depending on what kind of node was translated
export type TranslationResult =
	| { type: "expression"; value: Expression<unknown> | RawBuilder<unknown> }
	| { type: "query"; value: SelectQueryBuilder<Record<string, unknown>, string, unknown> }
	| { type: "literal"; value: string | number | boolean | null }
	| { type: "reference"; column: string; tableAlias: string | null }

export class TranslationError extends Error {
	constructor(
		message: string,
		public node: ExprNode,
		public context?: TranslationContext
	) {
		super(message)
		this.name = "TranslationError"
	}
}

// main entry point for translating an expression node
export function translateExpression(node: ExprNode, ctx: TranslationContext): TranslationResult {
	switch (node.type) {
		case "string":
			return translateString(node, ctx)
		case "number":
			return translateNumber(node, ctx)
		case "value":
			return translateValue(node, ctx)
		case "name":
			return translateName(node, ctx)
		case "variable":
			return translateVariable(node, ctx)
		case "binary":
			return translateBinary(node, ctx)
		case "path":
			return translatePath(node, ctx)
		case "unary":
			return translateUnary(node, ctx)
		case "function":
			return translateFunction(node, ctx)
		case "condition":
			return translateCondition(node, ctx)
		case "block":
			return translateBlock(node, ctx)
		case "bind":
			return translateBind(node, ctx)
		case "sort":
			return translateSort(node, ctx)
		default:
			throw new TranslationError(
				`unsupported node type: ${(node as ExprNode).type}`,
				node,
				ctx
			)
	}
}

// translate a string literal
function translateString(
	node: ExprNode & { type: "string" },
	_ctx: TranslationContext
): TranslationResult {
	return { type: "literal", value: node.value as string }
}

// translate a number literal
function translateNumber(
	node: ExprNode & { type: "number" },
	_ctx: TranslationContext
): TranslationResult {
	return { type: "literal", value: node.value as number }
}

// translate a value literal (boolean, null)
function translateValue(
	node: ExprNode & { type: "value" },
	_ctx: TranslationContext
): TranslationResult {
	return { type: "literal", value: node.value as boolean | null }
}

// translate a name (field reference or relation)
// note: this may temporarily modify ctx.currentTable/currentTableAlias for relation traversal
// the caller should save and restore context if needed for subsequent expressions
function translateName(
	node: ExprNode & { type: "name" },
	ctx: TranslationContext
): TranslationResult {
	const fieldName = node.value as string

	// if we have a current table context, first check for relations
	if (ctx.currentTable) {
		const tableSchema = ctx.schema.tables[ctx.currentTable]
		if (tableSchema) {
			// check if this is a relation
			const relation = tableSchema.relations[fieldName]
			if (relation) {
				// resolve the relation and register a pending join
				const resolved = resolveRelation(ctx, fieldName)
				if (resolved) {
					// update the context to point to the target table temporarily
					// this allows subsequent field access in the same path to resolve correctly
					ctx.currentTable = resolved.targetTableName
					ctx.currentTableAlias = resolved.targetAlias

					// return a placeholder that indicates we've traversed to a relation
					// the next step in the path will resolve fields from the target table
					return {
						type: "reference",
						column: "*",
						tableAlias: resolved.targetAlias,
					}
				}
			}

			// check for field
			const field = tableSchema.fields[fieldName]
			if (field) {
				return {
					type: "reference",
					column: field.column,
					tableAlias: ctx.currentTableAlias,
				}
			}
		}
	}

	// fall back to using the field name as-is
	return {
		type: "reference",
		column: fieldName,
		tableAlias: ctx.currentTableAlias,
	}
}

// translate a variable reference ($varName, $$, $input)
function translateVariable(
	node: ExprNode & { type: "variable" },
	ctx: TranslationContext
): TranslationResult {
	const varName = node.value as string

	// $$tableName parses as "$tableName" - this is a table reference
	if (varName.startsWith("$")) {
		const tableName = varName.slice(1)
		const tableSchema = ctx.schema.tables[tableName]
		if (tableSchema) {
			// this is a reference to a table for nested queries
			// return a placeholder that will be expanded
			return {
				type: "reference",
				column: "*",
				tableAlias: tableName,
			}
		}
	}

	// empty string is $$ (just the prefix)
	if (varName === "") {
		// inside a projection, $ refers to the current item
		const binding = ctx.bindings.get("")
		if (binding) {
			return {
				type: "expression",
				value: binding.ref as Expression<unknown>,
			}
		}
		// in the context of current table
		if (ctx.currentTableAlias) {
			return {
				type: "reference",
				column: "*",
				tableAlias: ctx.currentTableAlias,
			}
		}
		throw new TranslationError("$ reference without context", node, ctx)
	}

	// $input refers to query parameters
	if (varName === "input") {
		// this will be resolved when accessing properties
		return {
			type: "literal",
			value: null, // placeholder, actual value resolved in path
		}
	}

	// check for variable binding
	const binding = ctx.bindings.get(varName)
	if (binding) {
		return {
			type: "expression",
			value: binding.ref as Expression<unknown>,
		}
	}

	throw new TranslationError(`unresolved variable: $${varName}`, node, ctx)
}

// translate a binary expression
function translateBinary(
	node: ExprNode & { type: "binary" },
	ctx: TranslationContext
): TranslationResult {
	const binaryNode = node as unknown as {
		type: "binary"
		value: string
		lhs: ExprNode
		rhs: ExprNode
	}

	const left = translateExpression(binaryNode.lhs, ctx)
	const right = translateExpression(binaryNode.rhs, ctx)

	const leftSql = resultToSql(left, ctx)
	const rightSql = resultToSql(right, ctx)

	const op = binaryNode.value

	// map jsonata operators to sql
	switch (op) {
		// comparison
		case "=":
			return { type: "expression", value: sql`${leftSql} = ${rightSql}` }
		case "!=":
			return { type: "expression", value: sql`${leftSql} != ${rightSql}` }
		case "<":
			return { type: "expression", value: sql`${leftSql} < ${rightSql}` }
		case "<=":
			return { type: "expression", value: sql`${leftSql} <= ${rightSql}` }
		case ">":
			return { type: "expression", value: sql`${leftSql} > ${rightSql}` }
		case ">=":
			return { type: "expression", value: sql`${leftSql} >= ${rightSql}` }

		// arithmetic
		case "+":
			return { type: "expression", value: sql`${leftSql} + ${rightSql}` }
		case "-":
			return { type: "expression", value: sql`${leftSql} - ${rightSql}` }
		case "*":
			return { type: "expression", value: sql`${leftSql} * ${rightSql}` }
		case "/":
			return { type: "expression", value: sql`${leftSql} / ${rightSql}` }
		case "%":
			return { type: "expression", value: sql`${leftSql} % ${rightSql}` }

		// boolean
		case "and":
			return { type: "expression", value: sql`${leftSql} AND ${rightSql}` }
		case "or":
			return { type: "expression", value: sql`${leftSql} OR ${rightSql}` }

		// string concatenation
		case "&":
			return { type: "expression", value: sql`${leftSql} || ${rightSql}` }

		// range operator (for array slicing)
		case "..":
			// this is handled specially in limit translation
			return {
				type: "expression",
				value: sql`(${leftSql}, ${rightSql})`, // placeholder tuple
			}

		// membership test
		case "in":
			return { type: "expression", value: sql`${leftSql} = ANY(${rightSql})` }

		default:
			throw new TranslationError(`unsupported operator: ${op}`, node, ctx)
	}
}

// translate a path expression (the core query structure)
function translatePath(
	node: ExprNode & { type: "path" },
	ctx: TranslationContext
): TranslationResult {
	const pathNode = node as unknown as PathNode

	if (!pathNode.steps || pathNode.steps.length === 0) {
		throw new TranslationError("empty path expression", node, ctx)
	}

	// check if this is a nested query (starts with $$)
	if (isNestedQuery(node)) {
		// if we're in a projection context (depth > 0), this becomes a correlated subquery
		if (ctx.depth > 0 || ctx.parentContext) {
			return {
				type: "expression",
				value: buildJsonArraySubquery(pathNode, ctx),
			}
		}
		// otherwise, build as a regular nested query
		return buildNestedQuery(pathNode, ctx)
	}

	// process steps sequentially, building up the query
	let result: TranslationResult | null = null
	let currentCtx = ctx

	for (const step of pathNode.steps) {
		result = translatePathStep(step, currentCtx, result)
		// update context based on the step result
		currentCtx = updateContextFromStep(currentCtx, step, result)
	}

	return result!
}

// translate a single path step
function translatePathStep(
	step: ExprNode,
	ctx: TranslationContext,
	previous: TranslationResult | null
): TranslationResult {
	// handle the step based on its type
	const result = translateExpression(step, ctx)

	// check for stages (filter, sort, etc.) attached to the step
	const stepWithStages = step as unknown as {
		stages?: Array<{ type: string; expr?: ExprNode }>
	}

	if (stepWithStages.stages && stepWithStages.stages.length > 0) {
		return applyStages(result, stepWithStages.stages, ctx)
	}

	return result
}

// apply stages (filter, index) to a result
function applyStages(
	result: TranslationResult,
	stages: Array<{ type: string; expr?: ExprNode }>,
	ctx: TranslationContext
): TranslationResult {
	let current = result

	for (const stage of stages) {
		if (stage.type === "filter" && stage.expr) {
			current = applyFilter(current, stage.expr, ctx)
		}
		// sort and index stages will be handled in later stages
	}

	return current
}

// apply a filter predicate
function applyFilter(
	result: TranslationResult,
	filterExpr: ExprNode,
	ctx: TranslationContext
): TranslationResult {
	// check if filter is a numeric index (for LIMIT 1)
	if (filterExpr.type === "number") {
		// index access - will be handled in limit translation
		return result
	}

	// translate the filter condition
	const condition = translateExpression(filterExpr, ctx)
	const conditionSql = resultToSql(condition, ctx)

	// for now, return the condition as an expression
	// the actual WHERE clause application happens when building the query
	return {
		type: "expression",
		value: conditionSql,
	}
}

// update context after processing a path step
function updateContextFromStep(
	ctx: TranslationContext,
	step: ExprNode,
	_result: TranslationResult
): TranslationContext {
	// if the step is a variable referencing a table, update the context
	if (step.type === "variable") {
		const varName = (step as unknown as { value: string }).value
		if (varName === "$") {
			// $$ prefix indicates table reference
			// the actual table name comes from the next step
			return ctx
		}
	}

	// if the step is a name and we're after $$, it's a table reference
	if (step.type === "name") {
		const tableName = (step as unknown as { value: string }).value
		const tableSchema = ctx.schema.tables[tableName]
		if (tableSchema) {
			return {
				...ctx,
				currentTable: tableName,
				currentTableAlias: null,
			}
		}
	}

	return ctx
}

// translate a unary expression (negation, array/object constructors)
function translateUnary(
	node: ExprNode & { type: "unary" },
	ctx: TranslationContext
): TranslationResult {
	const unaryNode = node as unknown as {
		type: "unary"
		value: string
		expression?: ExprNode
		lhs?: Array<[ExprNode, ExprNode]>
		expressions?: ExprNode[]
	}

	switch (unaryNode.value) {
		case "-":
			// negation
			if (unaryNode.expression) {
				const inner = translateExpression(unaryNode.expression, ctx)
				const innerSql = resultToSql(inner, ctx)
				return { type: "expression", value: sql`-${innerSql}` }
			}
			break

		case "{":
			// object constructor - projection
			return translateObjectConstructor(unaryNode.lhs ?? [], ctx)

		case "[":
			// array constructor
			return translateArrayConstructor(unaryNode.expressions ?? [], ctx)
	}

	throw new TranslationError(`unsupported unary: ${unaryNode.value}`, node, ctx)
}

// translate object constructor (projection)
function translateObjectConstructor(
	pairs: Array<[ExprNode, ExprNode]>,
	ctx: TranslationContext
): TranslationResult {
	// this will be handled more fully in the projection stage
	// for now, build json_build_object
	const args: RawBuilder<unknown>[] = []

	for (const [keyNode, valueNode] of pairs) {
		const key = translateExpression(keyNode, ctx)
		const value = translateExpression(valueNode, ctx)

		if (key.type !== "literal" || typeof key.value !== "string") {
			throw new TranslationError("object keys must be string literals", keyNode, ctx)
		}

		args.push(sql.lit(key.value))
		args.push(resultToSql(value, ctx))
	}

	if (args.length === 0) {
		return { type: "expression", value: sql`'{}'::jsonb` }
	}

	// build json_build_object call
	const argsSql = sql.join(args, sql`, `)
	return { type: "expression", value: sql`json_build_object(${argsSql})` }
}

// translate array constructor
function translateArrayConstructor(
	elements: ExprNode[],
	ctx: TranslationContext
): TranslationResult {
	if (elements.length === 0) {
		return { type: "expression", value: sql`ARRAY[]::jsonb[]` }
	}

	const translatedElements = elements.map((el) => {
		const result = translateExpression(el, ctx)
		return resultToSql(result, ctx)
	})

	const elementsSql = sql.join(translatedElements, sql`, `)
	return { type: "expression", value: sql`ARRAY[${elementsSql}]` }
}

// translate a function call
function translateFunction(
	node: ExprNode & { type: "function" },
	ctx: TranslationContext
): TranslationResult {
	const funcNode = node as unknown as {
		type: "function"
		procedure: { type: string; value: string }
		arguments: ExprNode[]
	}

	const funcName = funcNode.procedure.value

	// check if this is an aggregate function with a nested path argument
	const aggregateFuncs = ["sum", "count", "average", "min", "max"]
	if (aggregateFuncs.includes(funcName)) {
		// check if argument contains a path that starts with $$
		if (funcNode.arguments.length > 0) {
			const arg = funcNode.arguments[0]
			if (arg.type === "path" && isNestedQuery(arg)) {
				// build a scalar subquery for this aggregate
				return {
					type: "expression",
					value: buildScalarSubquery(node, ctx),
				}
			}
		}
	}

	const args = funcNode.arguments.map((arg) => translateExpression(arg, ctx))

	return translateFunctionCall(funcName, args, ctx, node)
}

// translate a specific function call
function translateFunctionCall(
	funcName: string,
	args: TranslationResult[],
	ctx: TranslationContext,
	node: ExprNode
): TranslationResult {
	// map jsonata functions to postgres functions
	switch (funcName) {
		// string functions
		case "lowercase":
			return singleArgFunc("LOWER", args, ctx)
		case "uppercase":
			return singleArgFunc("UPPER", args, ctx)
		case "trim":
			return singleArgFunc("TRIM", args, ctx)
		case "length":
			return singleArgFunc("LENGTH", args, ctx)

		// numeric functions
		case "floor":
			return singleArgFunc("FLOOR", args, ctx)
		case "ceil":
			return singleArgFunc("CEIL", args, ctx)
		case "abs":
			return singleArgFunc("ABS", args, ctx)
		case "sqrt":
			return singleArgFunc("SQRT", args, ctx)
		case "round":
			return multiArgFunc("ROUND", args, ctx)
		case "power":
			return multiArgFunc("POWER", args, ctx)

		// aggregate functions
		case "sum":
			return singleArgFunc("SUM", args, ctx)
		case "count":
			return countFunc(args, ctx)
		case "average":
			return singleArgFunc("AVG", args, ctx)
		case "min":
			return singleArgFunc("MIN", args, ctx)
		case "max":
			return singleArgFunc("MAX", args, ctx)

		// existence check
		case "exists": {
			const existsArg = args[0]
			const existsSql = resultToSql(existsArg, ctx)
			return { type: "expression", value: sql`${existsSql} IS NOT NULL` }
		}

		// type conversion
		case "string": {
			const stringArg = args[0]
			const stringSql = resultToSql(stringArg, ctx)
			return { type: "expression", value: sql`CAST(${stringSql} AS TEXT)` }
		}

		case "number": {
			const numberArg = args[0]
			const numberSql = resultToSql(numberArg, ctx)
			return { type: "expression", value: sql`CAST(${numberSql} AS NUMERIC)` }
		}

		// string manipulation
		case "substring":
			return substringFunc(args, ctx)

		case "contains":
			return containsFunc(args, ctx)

		case "split":
			return splitFunc(args, ctx)

		case "join":
			return joinFunc(args, ctx)

		case "replace":
			return replaceFunc(args, ctx)

		// boolean
		case "not": {
			const notArg = args[0]
			const notSql = resultToSql(notArg, ctx)
			return { type: "expression", value: sql`NOT ${notSql}` }
		}

		default:
			throw new TranslationError(`unsupported function: $${funcName}`, node, ctx)
	}
}

// helper for single-argument functions
function singleArgFunc(
	sqlFunc: string,
	args: TranslationResult[],
	ctx: TranslationContext
): TranslationResult {
	if (args.length < 1) {
		throw new Error(`${sqlFunc} requires at least 1 argument`)
	}
	const argSql = resultToSql(args[0], ctx)
	return { type: "expression", value: sql.raw(`${sqlFunc}(${argSql.compile(ctx.db).sql})`) }
}

// helper for multi-argument functions
function multiArgFunc(
	sqlFunc: string,
	args: TranslationResult[],
	ctx: TranslationContext
): TranslationResult {
	const argsSql = args.map((a) => resultToSql(a, ctx))
	const joined = sql.join(argsSql, sql`, `)
	return { type: "expression", value: sql.raw(`${sqlFunc}(${joined.compile(ctx.db).sql})`) }
}

// count function - handles count(items) vs count(*)
function countFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	if (args.length === 0) {
		return { type: "expression", value: sql`COUNT(*)` }
	}
	const argSql = resultToSql(args[0], ctx)
	return { type: "expression", value: sql`COUNT(${argSql})` }
}

// substring function - adjusts for 0-based to 1-based indexing
function substringFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	const strSql = resultToSql(args[0], ctx)
	const startSql = resultToSql(args[1], ctx)

	if (args.length >= 3) {
		const lenSql = resultToSql(args[2], ctx)
		return {
			type: "expression",
			value: sql`SUBSTRING(${strSql} FROM ${startSql} + 1 FOR ${lenSql})`,
		}
	}

	return {
		type: "expression",
		value: sql`SUBSTRING(${strSql} FROM ${startSql} + 1)`,
	}
}

// contains function
function containsFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	const strSql = resultToSql(args[0], ctx)
	const patternSql = resultToSql(args[1], ctx)
	return {
		type: "expression",
		value: sql`POSITION(${patternSql} IN ${strSql}) > 0`,
	}
}

// split function
function splitFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	const strSql = resultToSql(args[0], ctx)
	const delimSql = resultToSql(args[1], ctx)
	return {
		type: "expression",
		value: sql`STRING_TO_ARRAY(${strSql}, ${delimSql})`,
	}
}

// join function
function joinFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	const arrSql = resultToSql(args[0], ctx)
	const sepSql = args.length > 1 ? resultToSql(args[1], ctx) : sql.lit("")
	return {
		type: "expression",
		value: sql`ARRAY_TO_STRING(${arrSql}, ${sepSql})`,
	}
}

// replace function
function replaceFunc(args: TranslationResult[], ctx: TranslationContext): TranslationResult {
	const strSql = resultToSql(args[0], ctx)
	const fromSql = resultToSql(args[1], ctx)
	const toSql = resultToSql(args[2], ctx)
	return {
		type: "expression",
		value: sql`REPLACE(${strSql}, ${fromSql}, ${toSql})`,
	}
}

// translate a conditional expression
function translateCondition(
	node: ExprNode & { type: "condition" },
	ctx: TranslationContext
): TranslationResult {
	const condNode = node as unknown as {
		type: "condition"
		condition: ExprNode
		then: ExprNode
		else: ExprNode
	}

	const condition = translateExpression(condNode.condition, ctx)
	const thenBranch = translateExpression(condNode.then, ctx)
	const elseBranch = translateExpression(condNode.else, ctx)

	const condSql = resultToSql(condition, ctx)
	const thenSql = resultToSql(thenBranch, ctx)
	const elseSql = resultToSql(elseBranch, ctx)

	return {
		type: "expression",
		value: sql`CASE WHEN ${condSql} THEN ${thenSql} ELSE ${elseSql} END`,
	}
}

// translate a block expression (variable bindings)
function translateBlock(
	node: ExprNode & { type: "block" },
	ctx: TranslationContext
): TranslationResult {
	const blockNode = node as unknown as {
		type: "block"
		expressions: ExprNode[]
	}

	// process expressions sequentially
	// bind expressions update the context
	// the last expression is the result
	let result: TranslationResult | null = null
	let currentCtx = ctx

	for (const expr of blockNode.expressions) {
		if (expr.type === "bind") {
			// process binding and update context
			const bindResult = translateExpression(expr, currentCtx)
			currentCtx = bindResult as unknown as TranslationContext
		} else {
			result = translateExpression(expr, currentCtx)
		}
	}

	if (!result) {
		throw new TranslationError("empty block expression", node, ctx)
	}

	return result
}

// translate a bind expression ($x := expr)
function translateBind(
	node: ExprNode & { type: "bind" },
	ctx: TranslationContext
): TranslationResult {
	const bindNode = node as unknown as {
		type: "bind"
		lhs: { type: "variable"; value: string }
		rhs: ExprNode
	}

	const varName = bindNode.lhs.value
	const valueResult = translateExpression(bindNode.rhs, ctx)

	// add binding to context
	ctx.bindings.set(varName, {
		ref: resultToSql(valueResult, ctx),
	})

	// return a placeholder - the actual result is the context update
	return { type: "literal", value: null }
}

// translate a sort expression
function translateSort(
	node: ExprNode & { type: "sort" },
	ctx: TranslationContext
): TranslationResult {
	// sort is handled as a modifier to the query, not a standalone expression
	// for now, return a placeholder
	const sortNode = node as unknown as {
		type: "sort"
		terms: Array<{ descending: boolean; expression: ExprNode }>
	}

	// translate the sort terms (for later use in query building)
	const _terms = sortNode.terms.map((term) => ({
		descending: term.descending,
		expr: translateExpression(term.expression, ctx),
	}))

	// placeholder - actual ORDER BY applied in query builder
	return { type: "literal", value: null }
}

// convert a translation result to a sql expression
export function resultToSql(
	result: TranslationResult,
	ctx: TranslationContext
): RawBuilder<unknown> {
	switch (result.type) {
		case "literal":
			if (result.value === null) {
				return sql`NULL`
			}
			return sql.lit(result.value)

		case "reference":
			if (result.tableAlias) {
				return sql.ref(`${result.tableAlias}.${result.column}`)
			}
			return sql.ref(result.column)

		case "expression":
			return result.value as RawBuilder<unknown>

		case "query":
			// wrap query as subquery
			return sql`(${result.value})`

		default:
			throw new Error(`cannot convert result to sql: ${(result as TranslationResult).type}`)
	}
}
