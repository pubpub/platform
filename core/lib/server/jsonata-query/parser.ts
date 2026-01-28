import jsonata from "jsonata"

import { InvalidPathError, UnsupportedExpressionError } from "./errors"
import {
	BUILTIN_FIELDS,
	type BuiltinField,
	type ComparisonCondition,
	type ComparisonOperator,
	type FunctionCondition,
	isBooleanFunction,
	isComparisonOp,
	isLogicalOp,
	isStringFunction,
	isTransformFunction,
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
	type TransformFunction,
} from "./types"

export type { ParsedCondition }

export interface ParsedQuery {
	condition: ParsedCondition
	originalExpression: string
	maxRelationDepth: number
}

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

// node type guards

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

// utility functions

function stepsToString(steps: JsonataPathStep[]): string {
	return steps.map((s) => (s.type === "variable" ? "$" : s.value)).join(".")
}

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
	if (isUnaryNode(node) && node.value === "[" && node.expressions) {
		return node.expressions.map(extractLiteral)
	}
	throw new UnsupportedExpressionError(
		`expected literal value, got ${node.type}`,
		node.type,
		JSON.stringify(node)
	)
}

function getFunctionName(procedure: JsonataFunctionNode["procedure"]): string {
	if (procedure.type === "variable") {
		return procedure.value
	}
	if (procedure.type === "path" && procedure.steps && procedure.steps.length > 0) {
		return procedure.steps[0].value
	}
	throw new UnsupportedExpressionError("unexpected procedure type", procedure.type)
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

// path extraction

function extractPubFieldPath(steps: JsonataPathStep[]): PubFieldPath {
	if (steps.length < 3) {
		throw new InvalidPathError("path too short, expected $.pub.something", stepsToString(steps))
	}

	if (steps[0].type !== "variable" || steps[0].value !== "") {
		throw new InvalidPathError("path must start with $", stepsToString(steps))
	}

	if (steps[1].type !== "name" || steps[1].value !== "pub") {
		throw new InvalidPathError("path must start with $.pub", stepsToString(steps))
	}

	const thirdStep = steps[2]
	if (thirdStep.type !== "name") {
		throw new InvalidPathError("expected name after $.pub", stepsToString(steps))
	}

	if (BUILTIN_FIELDS.includes(thirdStep.value as BuiltinField)) {
		return { kind: "builtin", field: thirdStep.value as BuiltinField }
	}

	if (thirdStep.value === "pubType" && steps.length >= 4) {
		const fourthStep = steps[3]
		if (fourthStep.type === "name" && ["name", "id"].includes(fourthStep.value)) {
			return { kind: "pubType", field: fourthStep.value as "name" | "id" }
		}
		throw new InvalidPathError("expected pubType.name or pubType.id", stepsToString(steps))
	}

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

function extractRelationContextPath(steps: JsonataPathStep[]): RelationContextPath {
	if (steps.length < 2) {
		throw new InvalidPathError(
			"path too short, expected $.value or $.relatedPub.something",
			stepsToString(steps)
		)
	}

	if (steps[0].type !== "variable" || steps[0].value !== "") {
		throw new InvalidPathError("path must start with $", stepsToString(steps))
	}

	const secondStep = steps[1]
	if (secondStep.type !== "name") {
		throw new InvalidPathError("expected name after $", stepsToString(steps))
	}

	if (secondStep.value === "value" && steps.length === 2) {
		return { kind: "relationValue" }
	}

	if (secondStep.value === "relatedPub") {
		if (steps.length < 3) {
			throw new InvalidPathError("expected field after $.relatedPub", stepsToString(steps))
		}

		const thirdStep = steps[2]
		if (thirdStep.type !== "name") {
			throw new InvalidPathError("expected name after $.relatedPub", stepsToString(steps))
		}

		if (["id", "createdAt", "updatedAt", "pubTypeId"].includes(thirdStep.value)) {
			return {
				kind: "relatedPubBuiltin",
				field: thirdStep.value as "id" | "createdAt" | "updatedAt" | "pubTypeId",
			}
		}

		if (thirdStep.value === "pubType" && steps.length >= 4) {
			const fourthStep = steps[3]
			if (fourthStep.type === "name" && ["name", "id"].includes(fourthStep.value)) {
				return { kind: "relatedPubType", field: fourthStep.value as "name" | "id" }
			}
			throw new InvalidPathError("expected pubType.name or pubType.id", stepsToString(steps))
		}

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

// relation path detection

function isRelationPath(
	steps: JsonataPathStep[]
): { direction: RelationDirection; fieldSlug: string; filterExpr?: JsonataNode } | null {
	if (steps.length < 4) {
		return null
	}

	if (steps[0].type !== "variable" || steps[0].value !== "") {
		return null
	}

	if (steps[1].type !== "name" || steps[1].value !== "pub") {
		return null
	}

	const thirdStep = steps[2]
	if (thirdStep.type !== "name" || !["out", "in"].includes(thirdStep.value)) {
		return null
	}

	const direction = thirdStep.value as RelationDirection
	const fourthStep = steps[3]
	if (fourthStep.type !== "name") {
		return null
	}

	return {
		direction,
		fieldSlug: fourthStep.value,
		filterExpr: fourthStep.stages?.[0]?.expr,
	}
}

// generic comparison parsing (works for both pub and relation contexts)

interface ParsedComparisonBase<P> {
	path: P
	operator: ComparisonOperator
	value: LiteralValue
	pathTransform?: TransformFunction
}

function parseComparisonGeneric<P>(
	pathNode: JsonataPathNode | JsonataFunctionNode,
	operator: ComparisonOperator,
	valueNode: JsonataNode,
	extractPath: (steps: JsonataPathStep[]) => P,
	contextName: string
): ParsedComparisonBase<P> {
	let path: P
	let pathTransform: TransformFunction | undefined

	if (isPathNode(pathNode)) {
		path = extractPath(pathNode.steps)
	} else if (isFunctionNode(pathNode)) {
		const funcName = getFunctionName(pathNode.procedure)
		if (!isTransformFunction(funcName)) {
			throw new UnsupportedExpressionError(
				`function ${funcName} cannot be used as path transform${contextName ? ` in ${contextName}` : ""}`,
				funcName
			)
		}
		pathTransform = funcName
		const arg = pathNode.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError(
				"expected path as first argument to transform function"
			)
		}
		path = extractPath(arg.steps)
	} else {
		throw new UnsupportedExpressionError(
			`expected path or function on left side of comparison${contextName ? ` in ${contextName}` : ""}`
		)
	}

	return {
		path,
		operator,
		value: extractLiteral(valueNode),
		pathTransform,
	}
}

// generic string function parsing

interface ParsedFunctionBase<P> {
	name: StringFunction
	path: P
	arguments: LiteralValue[]
	pathTransform?: TransformFunction
}

function parseStringFunctionGeneric<P>(
	funcName: string,
	node: JsonataFunctionNode,
	extractPath: (steps: JsonataPathStep[]) => P,
	contextName: string
): ParsedFunctionBase<P> {
	if (node.arguments.length !== 2) {
		throw new UnsupportedExpressionError(`${funcName}() expects exactly two arguments`)
	}

	const pathArg = node.arguments[0]
	const valueArg = node.arguments[1]

	let path: P
	let pathTransform: TransformFunction | undefined

	if (isPathNode(pathArg)) {
		path = extractPath(pathArg.steps)
	} else if (isFunctionNode(pathArg)) {
		const transformName = getFunctionName(pathArg.procedure)
		if (!isTransformFunction(transformName)) {
			throw new UnsupportedExpressionError(
				`function ${transformName} cannot be used as path transform${contextName ? ` in ${contextName}` : ""}`,
				transformName
			)
		}
		pathTransform = transformName
		const innerArg = pathArg.arguments[0]
		if (!isPathNode(innerArg)) {
			throw new UnsupportedExpressionError("expected path as argument to transform function")
		}
		path = extractPath(innerArg.steps)
	} else {
		throw new UnsupportedExpressionError(
			`${funcName}() expects a path or transform function as first argument`
		)
	}

	return {
		name: funcName as StringFunction,
		path,
		arguments: [extractLiteral(valueArg)],
		pathTransform,
	}
}

// top-level parsing

function parseFunctionCall(node: JsonataFunctionNode): ParsedCondition {
	const funcName = getFunctionName(node.procedure)

	if (!SUPPORTED_FUNCTIONS.has(funcName)) {
		throw new UnsupportedExpressionError(`unsupported function: ${funcName}`, funcName)
	}

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

	if (funcName === "not") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("not() expects exactly one argument")
		}
		const inner = parseNode(node.arguments[0])
		return { type: "not", condition: inner } satisfies NotCondition
	}

	if (isBooleanFunction(funcName)) {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError(`${funcName}() expects exactly one argument`)
		}
		const arg = node.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError(`${funcName}() expects a path argument`)
		}
		return {
			type: "function",
			name: funcName,
			path: extractPubFieldPath(arg.steps),
			arguments: [],
		} satisfies FunctionCondition
	}

	if (isStringFunction(funcName)) {
		const parsed = parseStringFunctionGeneric(funcName, node, extractPubFieldPath, "")
		return {
			type: "function",
			...parsed,
		} satisfies FunctionCondition
	}

	throw new UnsupportedExpressionError(`unhandled function: ${funcName}`, funcName)
}

function parseBinary(node: JsonataBinaryNode): ParsedCondition {
	const op = node.value

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
		if (isPathNode(node.lhs)) {
			const path = extractPubFieldPath(node.lhs.steps)
			const value = extractLiteral(node.rhs)
			return { type: "comparison", path, operator: "in", value } satisfies ComparisonCondition
		}
		if (isLiteralNode(node.lhs) && isPathNode(node.rhs)) {
			const path = extractPubFieldPath(node.rhs.steps)
			const value = extractLiteral(node.lhs)
			return {
				type: "function",
				name: "contains",
				path,
				arguments: [value],
			} satisfies FunctionCondition
		}
		throw new UnsupportedExpressionError("unsupported 'in' expression structure")
	}

	if (isComparisonOp(op)) {
		if (isPathNode(node.lhs) || isFunctionNode(node.lhs)) {
			const parsed = parseComparisonGeneric(node.lhs, op, node.rhs, extractPubFieldPath, "")
			return { type: "comparison", ...parsed } satisfies ComparisonCondition
		}
		if (isPathNode(node.rhs) || isFunctionNode(node.rhs)) {
			const parsed = parseComparisonGeneric(
				node.rhs,
				flipOperator(op),
				node.lhs,
				extractPubFieldPath,
				""
			)
			return { type: "comparison", ...parsed } satisfies ComparisonCondition
		}
		throw new UnsupportedExpressionError("comparison must have at least one path")
	}

	throw new UnsupportedExpressionError(`unsupported binary operator: ${op}`, "binary")
}

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

function parseNode(node: JsonataNode): ParsedCondition {
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

	if (isPathNode(node)) {
		const relation = isRelationPath(node.steps)
		if (relation) {
			return parseRelationPath(node)
		}
	}

	throw new UnsupportedExpressionError(`unsupported node type: ${node.type}`, node.type)
}

// relation filter parsing

function parseRelationFunctionCall(node: JsonataFunctionNode): RelationFilterCondition {
	const funcName = getFunctionName(node.procedure)

	if (funcName === "not") {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError("not() expects exactly one argument")
		}
		const inner = parseRelationFilterNode(node.arguments[0])
		return { type: "relationNot", condition: inner } satisfies RelationNotCondition
	}

	if (isBooleanFunction(funcName)) {
		if (node.arguments.length !== 1) {
			throw new UnsupportedExpressionError(`${funcName}() expects exactly one argument`)
		}
		const arg = node.arguments[0]
		if (!isPathNode(arg)) {
			throw new UnsupportedExpressionError(`${funcName}() expects a path argument`)
		}
		return {
			type: "relationFunction",
			name: funcName,
			path: extractRelationContextPath(arg.steps),
			arguments: [],
		} satisfies RelationFunctionCondition
	}

	if (isStringFunction(funcName)) {
		const parsed = parseStringFunctionGeneric(
			funcName,
			node,
			extractRelationContextPath,
			"relation filter"
		)
		return {
			type: "relationFunction",
			...parsed,
		} satisfies RelationFunctionCondition
	}

	throw new UnsupportedExpressionError(
		`unsupported function in relation filter: ${funcName}`,
		funcName
	)
}

function parseRelationBinary(node: JsonataBinaryNode): RelationFilterCondition {
	const op = node.value

	if (isLogicalOp(op)) {
		const left = parseRelationFilterNode(node.lhs)
		const right = parseRelationFilterNode(node.rhs)
		return {
			type: "relationLogical",
			operator: op,
			conditions: [left, right],
		} satisfies RelationLogicalCondition
	}

	if (op === "in") {
		if (isPathNode(node.lhs)) {
			const path = extractRelationContextPath(node.lhs.steps)
			const value = extractLiteral(node.rhs)
			return {
				type: "relationComparison",
				path,
				operator: "in",
				value,
			} satisfies RelationComparisonCondition
		}
		if (isLiteralNode(node.lhs) && isPathNode(node.rhs)) {
			const path = extractRelationContextPath(node.rhs.steps)
			const value = extractLiteral(node.lhs)
			return {
				type: "relationFunction",
				name: "contains",
				path,
				arguments: [value],
			} satisfies RelationFunctionCondition
		}
		throw new UnsupportedExpressionError(
			"unsupported 'in' expression structure in relation filter"
		)
	}

	if (isComparisonOp(op)) {
		if (isPathNode(node.lhs) || isFunctionNode(node.lhs)) {
			const parsed = parseComparisonGeneric(
				node.lhs,
				op,
				node.rhs,
				extractRelationContextPath,
				"relation filter"
			)
			return {
				type: "relationComparison",
				...parsed,
			} satisfies RelationComparisonCondition
		}
		if (isPathNode(node.rhs) || isFunctionNode(node.rhs)) {
			const parsed = parseComparisonGeneric(
				node.rhs,
				flipOperator(op),
				node.lhs,
				extractRelationContextPath,
				"relation filter"
			)
			return {
				type: "relationComparison",
				...parsed,
			} satisfies RelationComparisonCondition
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

function parseRelationFilterNode(node: JsonataNode): RelationFilterCondition {
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

// depth calculation

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

// public api

export function parseJsonataQuery(expression: string): ParsedQuery {
	console.log("expression", expression)
	const ast = jsonata(expression).ast() as JsonataNode
	console.log("ast", ast)

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
