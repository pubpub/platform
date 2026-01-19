import type {
	ComparisonCondition,
	ComparisonOperator,
	JsonataBinaryNode,
	JsonataBlockNode,
	JsonataFunctionNode,
	JsonataNode,
	JsonataNumberNode,
	JsonataPathNode,
	JsonataPathStep,
	JsonataStringNode,
	JsonataUnaryNode,
	JsonataValueNode,
	LiteralValue,
	LogicalCondition,
	LogicalOperator,
	NotCondition,
	ParsedCondition,
	PubFieldPath,
	StringFunction,
} from "./types"

import jsonata from "jsonata"

import { InvalidPathError, UnsupportedExpressionError } from "./errors"

export type { ParsedCondition }

export interface ParsedQuery {
	condition: ParsedCondition
	originalExpression: string
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
])

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
	if (["id", "createdAt", "updatedAt", "pubTypeId"].includes(thirdStep.value)) {
		return { kind: "builtin", field: thirdStep.value as "id" | "createdAt" | "updatedAt" }
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

	throw new InvalidPathError(`unsupported pub path: $.pub.${thirdStep.value}`, stepsToString(steps))
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
			throw new UnsupportedExpressionError("expected path as first argument to transform function")
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
	if (["contains", "startsWith", "endsWith"].includes(funcName)) {
		if (node.arguments.length !== 2) {
			throw new UnsupportedExpressionError(`${funcName}() expects exactly two arguments`)
		}
		const pathArg = node.arguments[0]
		const valueArg = node.arguments[1]
		if (!isPathNode(pathArg)) {
			throw new UnsupportedExpressionError(`${funcName}() expects a path as first argument`)
		}
		const path = extractPubFieldPath(pathArg.steps)
		const value = extractLiteral(valueArg)
		return {
			type: "function",
			name: funcName as StringFunction,
			path,
			arguments: [value],
		}
	}

	throw new UnsupportedExpressionError(`unhandled function: ${funcName}`, funcName)
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

	// handle "in" operator: $.pub.values.number in [42, 24, 54]
	if (op === "in") {
		// check if lhs is path and rhs is array
		if (isPathNode(node.lhs)) {
			const path = extractPubFieldPath(node.lhs.steps)
			const value = extractLiteral(node.rhs)
			return { type: "comparison", path, operator: "in", value }
		}
		// check if lhs is literal and rhs is path: "value" in $.pub.values.array
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

	throw new UnsupportedExpressionError(`unsupported node type: ${node.type}`, node.type)
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

	return {
		condition,
		originalExpression: expression,
	}
}
