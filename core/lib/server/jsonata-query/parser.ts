import jsonata from "jsonata"

import { InvalidPathError, UnsupportedExpressionError } from "./errors"
import {
	BUILTIN_FIELDS,
	type BuiltinField,
	type ComparisonCondition,
	type ComparisonOperator,
	type JsonataBinaryNode,
	type JsonataBlockNode,
	type JsonataFunctionNode,
	type JsonataNode,
	type JsonataNumberNode,
	type JsonataPathNode,
	type JsonataPathStep,
	type JsonataStringNode,
	type JsonataUnaryNode,
	type JsonataValueNode,
	type LiteralValue,
	type LogicalCondition,
	type LogicalOperator,
	type NotCondition,
	type ParsedCondition,
	type PubFieldPath,
	type RelationComparisonCondition,
	type RelationCondition,
	type RelationContextPath,
	type RelationDirection,
	type RelationFilterCondition,
	type RelationFunctionCondition,
	type RelationLogicalCondition,
	type RelationNotCondition,
	type SearchCondition,
	type StringFunction,
} from "./types"

export type { ParsedCondition }

export interface ParsedQuery {
	condition: ParsedCondition
	originalExpression: string
	// track max relation depth for validation
	maxRelationDepth: number
}

const COMPARISON_OPS = new Set(["=", "!=", "<", "<=", ">", ">="]) as Set<ComparisonOperator>
const LOGICAL_OPS = new Set(["and", "or"]) as Set<LogicalOperator>

const SUPPORTED_FUNCTIONS = new Set([
	"contains",
	"startsWith",
	"endsWith",
	"lowercase",
	"uppercase",
	"exists",
	"not",
	"search",
])

const MAX_RELATION_DEPTH = 3

function isComparisonOp(op: string): op is ComparisonOperator {
	return COMPARISON_OPS.has(op as ComparisonOperator)
}

function isLogicalOp(op: string): op is LogicalOperator {
	return LOGICAL_OPS.has(op as LogicalOperator)
}

function isBinaryNode(node: JsonataNode): node is JsonataBinaryNode {
	return node.type === "binary"
}

function isPathNode(node: JsonataNode): node is JsonataPathNode {
	return node.type === "path"
}

function isFunctionNode(node: JsonataNode): node is JsonataFunctionNode {
	return node.type === "function"
}

function isBlockNode(node: JsonataNode): node is JsonataBlockNode {
	return node.type === "block"
}

function isUnaryNode(node: JsonataNode): node is JsonataUnaryNode {
	return node.type === "unary"
}

function isLiteralNode(
	node: JsonataNode
): node is JsonataStringNode | JsonataNumberNode | JsonataValueNode {
	return node.type === "string" || node.type === "number" || node.type === "value"
}

/**
 * extracts the pub field path from a jsonata path node
 *
 * expects paths like:
 * - $.pub.values.fieldname
 * - $.pub.id
 * - $.pub.createdAt
 * - $.pub.pubType.name
 */
function extractPubFieldPath(steps: JsonataPathStep[]): PubFieldPath {
	if (steps.length < 3) {
		throw new InvalidPathError("path too short, expected $.pub.something", stepsToString(steps))
	}

	// first step should be $ (empty variable)
	if (steps[0].type !== "variable" || steps[0].value !== "") {
		throw new InvalidPathError("path must start with $", stepsToString(steps))
	}

	// second step should be "pub"
	if (steps[1].type !== "name" || steps[1].value !== "pub") {
		throw new InvalidPathError("path must start with $.pub", stepsToString(steps))
	}

	const thirdStep = steps[2]
	if (thirdStep.type !== "name") {
		throw new InvalidPathError("expected name after $.pub", stepsToString(steps))
	}

	// handle builtin fields
	if (BUILTIN_FIELDS.includes(thirdStep.value as BuiltinField)) {
		return { kind: "builtin", field: thirdStep.value as BuiltinField }
	}

	// handle pubType.name or pubType.id
	if (thirdStep.value === "pubType" && steps.length >= 4) {
		const fourthStep = steps[3]
		if (fourthStep.type === "name" && ["name", "id"].includes(fourthStep.value)) {
			return { kind: "pubType", field: fourthStep.value as "name" | "id" }
		}
		throw new InvalidPathError("expected pubType.name or pubType.id", stepsToString(steps))
	}

	// handle values.fieldname
	if (thirdStep.value === "values" && steps.length >= 4) {
		const fourthStep = steps[3]
		if (fourthStep.type === "name") {
			return { kind: "value", fieldSlug: fourthStep.value }
		}
		throw new InvalidPathError("expected field name after $.pub.values", stepsToString(steps))
	}

	throw new InvalidPathError(
		`unsupported pub path: $.pub.${thirdStep.value}`,
		stepsToString(steps)
	)
}

/**
 * extracts a relation context path from steps inside a relation filter
 *
 * expects paths like:
 * - $.value (the relation's own value)
 * - $.relatedPub.values.fieldname
 * - $.relatedPub.id
 * - $.relatedPub.pubType.name
 */
function extractRelationContextPath(steps: JsonataPathStep[]): RelationContextPath {
	if (steps.length < 2) {
		throw new InvalidPathError(
			"path too short, expected $.value or $.relatedPub.something",
			stepsToString(steps)
		)
	}

	// first step should be $ (empty variable)
	if (steps[0].type !== "variable" || steps[0].value !== "") {
		throw new InvalidPathError("path must start with $", stepsToString(steps))
	}

	const secondStep = steps[1]
	if (secondStep.type !== "name") {
		throw new InvalidPathError("expected name after $", stepsToString(steps))
	}

	// handle $.value - the relation's own value
	if (secondStep.value === "value" && steps.length === 2) {
		return { kind: "relationValue" }
	}

	// handle $.relatedPub...
	if (secondStep.value === "relatedPub") {
		if (steps.length < 3) {
			throw new InvalidPathError("expected field after $.relatedPub", stepsToString(steps))
		}

		const thirdStep = steps[2]
		if (thirdStep.type !== "name") {
			throw new InvalidPathError("expected name after $.relatedPub", stepsToString(steps))
		}

		// handle builtin fields on related pub
		if (["id", "createdAt", "updatedAt", "pubTypeId"].includes(thirdStep.value)) {
			return {
				kind: "relatedPubBuiltin",
				field: thirdStep.value as "id" | "createdAt" | "updatedAt" | "pubTypeId",
			}
		}

		// handle $.relatedPub.pubType.name or $.relatedPub.pubType.id
		if (thirdStep.value === "pubType" && steps.length >= 4) {
			const fourthStep = steps[3]
			if (fourthStep.type === "name" && ["name", "id"].includes(fourthStep.value)) {
				return { kind: "relatedPubType", field: fourthStep.value as "name" | "id" }
			}
			throw new InvalidPathError("expected pubType.name or pubType.id", stepsToString(steps))
		}

		// handle $.relatedPub.values.fieldname
		if (thirdStep.value === "values" && steps.length >= 4) {
			const fourthStep = steps[3]
			if (fourthStep.type === "name") {
				return { kind: "relatedPubValue", fieldSlug: fourthStep.value }
			}
			throw new InvalidPathError(
				"expected field name after $.relatedPub.values",
				stepsToString(steps)
			)
		}

		throw new InvalidPathError(
			`unsupported relatedPub path: $.relatedPub.${thirdStep.value}`,
			stepsToString(steps)
		)
	}

	throw new InvalidPathError(
		`unsupported relation context path: $.${secondStep.value}`,
		stepsToString(steps)
	)
}

/**
 * checks if a path represents a relation query ($.pub.out.field or $.pub.in.field)
 */
function isRelationPath(
	steps: JsonataPathStep[]
): { direction: RelationDirection; fieldSlug: string; filterExpr?: JsonataNode } | null {
	if (steps.length < 4) {
		return null
	}

	// first step should be $ (empty variable)
	if (steps[0].type !== "variable" || steps[0].value !== "") {
		return null
	}

	// second step should be "pub"
	if (steps[1].type !== "name" || steps[1].value !== "pub") {
		return null
	}

	// third step should be "out" or "in"
	const thirdStep = steps[2]
	if (thirdStep.type !== "name" || !["out", "in"].includes(thirdStep.value)) {
		return null
	}

	const direction = thirdStep.value as RelationDirection

	// fourth step is the field name (with optional filter)
	const fourthStep = steps[3]
	if (fourthStep.type !== "name") {
		return null
	}

	const fieldSlug = fourthStep.value
	const filterExpr = fourthStep.stages?.[0]?.expr

	return { direction, fieldSlug, filterExpr }
}

function stepsToString(steps: JsonataPathStep[]): string {
	return steps.map((s) => (s.type === "variable" ? "$" : s.value)).join(".")
}

/**
 * extracts a literal value from a jsonata node
 */
function extractLiteral(node: JsonataNode): LiteralValue {
	if (node.type === "string") {
		return node.value
	}
	if (node.type === "number") {
		return node.value
	}
	if (node.type === "value") {
		return node.value
	}
	// handle array literals [1, 2, 3]
	if (isUnaryNode(node) && node.value === "[" && node.expressions) {
		return node.expressions.map(extractLiteral)
	}
	throw new UnsupportedExpressionError(
		`expected literal value, got ${node.type}`,
		node.type,
		JSON.stringify(node)
	)
}

/**
 * gets the function name from a procedure
 */
function getFunctionName(procedure: JsonataFunctionNode["procedure"]): string {
	if (procedure.type === "variable") {
		return procedure.value
	}
	if (procedure.type === "path" && procedure.steps && procedure.steps.length > 0) {
		return procedure.steps[0].value
	}
	throw new UnsupportedExpressionError("unexpected procedure type", procedure.type)
}

/**
 * parses a binary comparison node
 */
function parseComparison(
	pathNode: JsonataPathNode | JsonataFunctionNode,
	operator: ComparisonOperator,
	valueNode: JsonataNode
): ComparisonCondition {
	let path: PubFieldPath
	let pathTransform: StringFunction | undefined

	if (isPathNode(pathNode)) {
		path = extractPubFieldPath(pathNode.steps)
	} else if (isFunctionNode(pathNode)) {
		// handle things like $lowercase($.pub.values.title) = "hello"
		const funcName = getFunctionName(pathNode.procedure)
		if (!["lowercase", "uppercase"].includes(funcName)) {
			throw new UnsupportedExpressionError(
				`function ${funcName} cannot be used as path transform`,
				funcName
			)
		}
		pathTransform = funcName as StringFunction
		const arg = pathNode.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError(
				"expected path as first argument to transform function"
			)
		}
		path = extractPubFieldPath(arg.steps)
	} else {
		throw new UnsupportedExpressionError("expected path or function on left side of comparison")
	}

	const value = extractLiteral(valueNode)

	return { type: "comparison", path, operator, value, pathTransform }
}

/**
 * parses a function call like $contains($.pub.values.title, "test")
 */
function parseFunctionCall(node: JsonataFunctionNode): ParsedCondition {
	const funcName = getFunctionName(node.procedure)

	if (!SUPPORTED_FUNCTIONS.has(funcName)) {
		throw new UnsupportedExpressionError(`unsupported function: ${funcName}`, funcName)
	}

	// handle $search() - full text search
	if (funcName === "search") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("search() expects exactly one argument")
		}
		const arg = node.arguments[0]
		if (arg.type !== "string") {
			throw new UnsupportedExpressionError("search() expects a string argument")
		}
		return { type: "search", query: arg.value } satisfies SearchCondition
	}

	// handle not() specially
	if (funcName === "not") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("not() expects exactly one argument")
		}
		const inner = parseNode(node.arguments[0])
		return { type: "not", condition: inner } satisfies NotCondition
	}

	// handle exists()
	if (funcName === "exists") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("exists() expects exactly one argument")
		}
		const arg = node.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError("exists() expects a path argument")
		}
		const path = extractPubFieldPath(arg.steps)
		return { type: "function", name: "exists", path, arguments: [] }
	}

	// string functions: contains, startsWith, endsWith
	// supports transforms like $contains($lowercase($.pub.values.title), "snap")
	if (["contains", "startsWith", "endsWith"].includes(funcName)) {
		if (node.arguments.length !== 2) {
			throw new UnsupportedExpressionError(`${funcName}() expects exactly two arguments`)
		}
		const pathArg = node.arguments[0]
		const valueArg = node.arguments[1]

		let path: PubFieldPath
		let pathTransform: StringFunction | undefined

		if (isPathNode(pathArg)) {
			path = extractPubFieldPath(pathArg.steps)
		} else if (isFunctionNode(pathArg)) {
			// handle transform wrapper like $lowercase($.pub.values.title)
			const transformName = getFunctionName(pathArg.procedure)
			if (!["lowercase", "uppercase"].includes(transformName)) {
				throw new UnsupportedExpressionError(
					`function ${transformName} cannot be used as path transform`,
					transformName
				)
			}
			pathTransform = transformName as StringFunction
			const innerArg = pathArg.arguments[0]
			if (!isPathNode(innerArg)) {
				throw new UnsupportedExpressionError(
					"expected path as argument to transform function"
				)
			}
			path = extractPubFieldPath(innerArg.steps)
		} else {
			throw new UnsupportedExpressionError(
				`${funcName}() expects a path or transform function as first argument`
			)
		}

		const value = extractLiteral(valueArg)
		return {
			type: "function",
			name: funcName as StringFunction,
			path,
			arguments: [value],
			pathTransform,
		}
	}

	throw new UnsupportedExpressionError(`unhandled function: ${funcName}`, funcName)
}

// ============================================================================
// relation filter parsing (inside [...] of relation queries)
// ============================================================================

/**
 * parses a comparison inside a relation filter context
 */
function parseRelationComparison(
	pathNode: JsonataPathNode | JsonataFunctionNode,
	operator: ComparisonOperator,
	valueNode: JsonataNode
): RelationComparisonCondition {
	let path: RelationContextPath
	let pathTransform: StringFunction | undefined

	if (isPathNode(pathNode)) {
		path = extractRelationContextPath(pathNode.steps)
	} else if (isFunctionNode(pathNode)) {
		const funcName = getFunctionName(pathNode.procedure)
		if (!["lowercase", "uppercase"].includes(funcName)) {
			throw new UnsupportedExpressionError(
				`function ${funcName} cannot be used as path transform in relation filter`,
				funcName
			)
		}
		pathTransform = funcName as StringFunction
		const arg = pathNode.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError(
				"expected path as first argument to transform function"
			)
		}
		path = extractRelationContextPath(arg.steps)
	} else {
		throw new UnsupportedExpressionError(
			"expected path or function on left side of comparison in relation filter"
		)
	}

	const value = extractLiteral(valueNode)

	return { type: "relationComparison", path, operator, value, pathTransform }
}

/**
 * parses a function call inside a relation filter context
 */
function parseRelationFunctionCall(node: JsonataFunctionNode): RelationFilterCondition {
	const funcName = getFunctionName(node.procedure)

	// handle not() specially
	if (funcName === "not") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("not() expects exactly one argument")
		}
		const inner = parseRelationFilterNode(node.arguments[0])
		return { type: "relationNot", condition: inner } satisfies RelationNotCondition
	}

	// handle exists()
	if (funcName === "exists") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("exists() expects exactly one argument")
		}
		const arg = node.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError("exists() expects a path argument")
		}
		const path = extractRelationContextPath(arg.steps)
		return { type: "relationFunction", name: "exists", path, arguments: [] }
	}

	// string functions: contains, startsWith, endsWith
	// supports transforms like $contains($lowercase($.relatedPub.values.title), "snap")
	if (["contains", "startsWith", "endsWith"].includes(funcName)) {
		if (node.arguments.length !== 2) {
			throw new UnsupportedExpressionError(`${funcName}() expects exactly two arguments`)
		}
		const pathArg = node.arguments[0]
		const valueArg = node.arguments[1]

		let path: RelationContextPath
		let pathTransform: StringFunction | undefined

		if (isPathNode(pathArg)) {
			path = extractRelationContextPath(pathArg.steps)
		} else if (isFunctionNode(pathArg)) {
			const transformName = getFunctionName(pathArg.procedure)
			if (!["lowercase", "uppercase"].includes(transformName)) {
				throw new UnsupportedExpressionError(
					`function ${transformName} cannot be used as path transform in relation filter`,
					transformName
				)
			}
			pathTransform = transformName as StringFunction
			const innerArg = pathArg.arguments[0]
			if (!isPathNode(innerArg)) {
				throw new UnsupportedExpressionError(
					"expected path as argument to transform function"
				)
			}
			path = extractRelationContextPath(innerArg.steps)
		} else {
			throw new UnsupportedExpressionError(
				`${funcName}() expects a path or transform function as first argument`
			)
		}

		const value = extractLiteral(valueArg)
		return {
			type: "relationFunction",
			name: funcName as StringFunction,
			path,
			arguments: [value],
			pathTransform,
		} satisfies RelationFunctionCondition
	}

	throw new UnsupportedExpressionError(
		`unsupported function in relation filter: ${funcName}`,
		funcName
	)
}

/**
 * parses a binary node inside a relation filter context
 */
function parseRelationBinary(node: JsonataBinaryNode): RelationFilterCondition {
	const op = node.value

	// handle logical operators
	if (isLogicalOp(op)) {
		const left = parseRelationFilterNode(node.lhs)
		const right = parseRelationFilterNode(node.rhs)
		return {
			type: "relationLogical",
			operator: op,
			conditions: [left, right],
		} satisfies RelationLogicalCondition
	}

	// handle "in" operator
	if (op === "in") {
		if (isPathNode(node.lhs)) {
			const path = extractRelationContextPath(node.lhs.steps)
			const value = extractLiteral(node.rhs)
			return { type: "relationComparison", path, operator: "in", value }
		}
		if (isLiteralNode(node.lhs) && isPathNode(node.rhs)) {
			const path = extractRelationContextPath(node.rhs.steps)
			const value = extractLiteral(node.lhs)
			return {
				type: "relationFunction",
				name: "contains",
				path,
				arguments: [value],
			}
		}
		throw new UnsupportedExpressionError(
			"unsupported 'in' expression structure in relation filter"
		)
	}

	// handle comparison operators
	if (isComparisonOp(op)) {
		if (isPathNode(node.lhs) || isFunctionNode(node.lhs)) {
			return parseRelationComparison(node.lhs, op, node.rhs)
		}
		if (isPathNode(node.rhs) || isFunctionNode(node.rhs)) {
			const flippedOp = flipOperator(op)
			return parseRelationComparison(node.rhs, flippedOp, node.lhs)
		}
		throw new UnsupportedExpressionError(
			"comparison must have at least one path in relation filter"
		)
	}

	throw new UnsupportedExpressionError(
		`unsupported binary operator in relation filter: ${op}`,
		"binary"
	)
}

/**
 * parses any node inside a relation filter context
 */
function parseRelationFilterNode(node: JsonataNode): RelationFilterCondition {
	// unwrap block nodes (parentheses)
	if (isBlockNode(node)) {
		if (node.expressions.length !== 1) {
			throw new UnsupportedExpressionError(
				"block with multiple expressions not supported in relation filter",
				"block"
			)
		}
		return parseRelationFilterNode(node.expressions[0])
	}

	if (isBinaryNode(node)) {
		return parseRelationBinary(node)
	}

	if (isFunctionNode(node)) {
		return parseRelationFunctionCall(node)
	}

	throw new UnsupportedExpressionError(
		`unsupported node type in relation filter: ${node.type}`,
		node.type
	)
}

/**
 * parses a relation path into a RelationCondition
 */
function parseRelationPath(pathNode: JsonataPathNode): RelationCondition {
	const relation = isRelationPath(pathNode.steps)
	if (!relation) {
		throw new UnsupportedExpressionError("expected relation path")
	}

	const { direction, fieldSlug, filterExpr } = relation

	let filter: RelationFilterCondition | undefined
	if (filterExpr) {
		filter = parseRelationFilterNode(filterExpr)
	}

	return {
		type: "relation",
		direction,
		fieldSlug,
		filter,
	}
}

/**
 * parses a binary node (comparison or logical)
 */
function parseBinary(node: JsonataBinaryNode): ParsedCondition {
	const op = node.value

	// handle logical operators
	if (isLogicalOp(op)) {
		const left = parseNode(node.lhs)
		const right = parseNode(node.rhs)
		return {
			type: "logical",
			operator: op,
			conditions: [left, right],
		} satisfies LogicalCondition
	}

	if (op === "in") {
		// check if lhs is path and rhs is array
		if (isPathNode(node.lhs)) {
			const path = extractPubFieldPath(node.lhs.steps)
			const value = extractLiteral(node.rhs)
			return { type: "comparison", path, operator: "in", value }
		}
		if (isLiteralNode(node.lhs) && isPathNode(node.rhs)) {
			const path = extractPubFieldPath(node.rhs.steps)
			const value = extractLiteral(node.lhs)
			return {
				type: "function",
				name: "contains",
				path,
				arguments: [value],
			}
		}
		throw new UnsupportedExpressionError("unsupported 'in' expression structure")
	}

	// handle comparison operators
	if (isComparisonOp(op)) {
		// determine which side is the path and which is the value
		if (isPathNode(node.lhs) || isFunctionNode(node.lhs)) {
			return parseComparison(node.lhs, op, node.rhs)
		}
		if (isPathNode(node.rhs) || isFunctionNode(node.rhs)) {
			// flip the operator for reversed comparison
			const flippedOp = flipOperator(op)
			return parseComparison(node.rhs, flippedOp, node.lhs)
		}
		throw new UnsupportedExpressionError("comparison must have at least one path")
	}

	throw new UnsupportedExpressionError(`unsupported binary operator: ${op}`, "binary")
}

function flipOperator(op: ComparisonOperator): ComparisonOperator {
	switch (op) {
		case "<":
			return ">"
		case ">":
			return "<"
		case "<=":
			return ">="
		case ">=":
			return "<="
		default:
			return op
	}
}

/**
 * parses any jsonata node into our condition format
 */
function parseNode(node: JsonataNode): ParsedCondition {
	// unwrap block nodes (parentheses)
	if (isBlockNode(node)) {
		if (node.expressions.length !== 1) {
			throw new UnsupportedExpressionError(
				"block with multiple expressions not supported",
				"block"
			)
		}
		return parseNode(node.expressions[0])
	}

	if (isBinaryNode(node)) {
		return parseBinary(node)
	}

	if (isFunctionNode(node)) {
		return parseFunctionCall(node)
	}

	// check if this is a relation path ($.pub.out.field or $.pub.in.field)
	if (isPathNode(node)) {
		const relation = isRelationPath(node.steps)
		if (relation) {
			return parseRelationPath(node)
		}
	}

	throw new UnsupportedExpressionError(`unsupported node type: ${node.type}`, node.type)
}

/**
 * calculates the max relation depth in a condition
 */
function calculateRelationDepth(condition: ParsedCondition, currentDepth = 0): number {
	switch (condition.type) {
		case "relation":
			return currentDepth + 1
		case "logical":
			return Math.max(
				...condition.conditions.map((c) => calculateRelationDepth(c, currentDepth))
			)
		case "not":
			return calculateRelationDepth(condition.condition, currentDepth)
		default:
			return currentDepth
	}
}

/**
 * parses a jsonata expression string into our query format
 *
 * @example
 * ```ts
 * const query = parseJsonataQuery('$.pub.values.title = "Test" and $.pub.values.number > 10')
 * // { condition: { type: 'logical', operator: 'and', conditions: [...] }, originalExpression: '...' }
 * ```
 */
export function parseJsonataQuery(expression: string): ParsedQuery {
	const ast = jsonata(expression).ast() as JsonataNode

	const condition = parseNode(ast)
	const maxRelationDepth = calculateRelationDepth(condition)

	if (maxRelationDepth > MAX_RELATION_DEPTH) {
		throw new UnsupportedExpressionError(
			`relation depth ${maxRelationDepth} exceeds maximum allowed depth of ${MAX_RELATION_DEPTH}`
		)
	}

	return {
		condition,
		originalExpression: expression,
		maxRelationDepth,
	}
}
