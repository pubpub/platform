// jsonata ast types (reverse-engineered from library)
export type JsonataNodeType =
	| "binary"
	| "unary"
	| "path"
	| "name"
	| "variable"
	| "string"
	| "number"
	| "value" // null, true, false
	| "function"
	| "block"
	| "filter"
	| "regex"

export interface JsonataBaseNode {
	type: JsonataNodeType
	position: number
	value?: unknown
}

export interface JsonataBinaryNode extends JsonataBaseNode {
	type: "binary"
	value: "=" | "!=" | "<" | "<=" | ">" | ">=" | "and" | "or" | "in" | "&"
	lhs: JsonataNode
	rhs: JsonataNode
}

export interface JsonataUnaryNode extends JsonataBaseNode {
	type: "unary"
	value: "[" | "-" // array literal or negation
	expressions?: JsonataNode[]
}

export interface JsonataPathStep {
	type: "name" | "variable"
	value: string
	position: number
	stages?: { type: "filter"; expr: JsonataNode; position: number }[]
}

export interface JsonataPathNode extends JsonataBaseNode {
	type: "path"
	steps: JsonataPathStep[]
}

export interface JsonataStringNode extends JsonataBaseNode {
	type: "string"
	value: string
}

export interface JsonataNumberNode extends JsonataBaseNode {
	type: "number"
	value: number
}

export interface JsonataValueNode extends JsonataBaseNode {
	type: "value"
	value: null | boolean
}

export interface JsonataFunctionNode extends JsonataBaseNode {
	type: "function"
	value: "("
	arguments: JsonataNode[]
	procedure: { type: "variable" | "path"; value: string; steps?: JsonataPathStep[] }
}

export interface JsonataBlockNode extends JsonataBaseNode {
	type: "block"
	expressions: JsonataNode[]
}

export type JsonataNode =
	| JsonataBinaryNode
	| JsonataUnaryNode
	| JsonataPathNode
	| JsonataStringNode
	| JsonataNumberNode
	| JsonataValueNode
	| JsonataFunctionNode
	| JsonataBlockNode

// operator and function definitions
export const COMPARISON_OPS = ["=", "!=", "<", "<=", ">", ">=", "in"] as const
export type ComparisonOperator = (typeof COMPARISON_OPS)[number]

export const LOGICAL_OPS = ["and", "or"] as const
export type LogicalOperator = (typeof LOGICAL_OPS)[number]

export const STRING_FUNCTIONS = ["contains", "startsWith", "endsWith"] as const
export type StringFunction = (typeof STRING_FUNCTIONS)[number]

export const TRANSFORM_FUNCTIONS = ["lowercase", "uppercase"] as const
export type TransformFunction = (typeof TRANSFORM_FUNCTIONS)[number]

export const BOOLEAN_FUNCTIONS = ["exists"] as const
export type BooleanFunction = (typeof BOOLEAN_FUNCTIONS)[number]

export const BUILTIN_FIELDS = [
	"id",
	"createdAt",
	"updatedAt",
	"pubTypeId",
	"title",
	"stageId",
] as const
export type BuiltinField = (typeof BUILTIN_FIELDS)[number]

// path types
export type PubFieldPath =
	| { kind: "value"; fieldSlug: string }
	| { kind: "builtin"; field: BuiltinField }
	| { kind: "pubType"; field: "name" | "id" }

export type RelationContextPath =
	| { kind: "relationValue" }
	| { kind: "relatedPubValue"; fieldSlug: string }
	| { kind: "relatedPubBuiltin"; field: BuiltinField }
	| { kind: "relatedPubType"; field: "name" | "id" }

export type LiteralValue = string | number | boolean | null | LiteralValue[]

// top-level condition types (for pub queries)
export interface ComparisonCondition {
	type: "comparison"
	path: PubFieldPath
	operator: ComparisonOperator
	value: LiteralValue
	pathTransform?: TransformFunction
}

export interface FunctionCondition {
	type: "function"
	name: StringFunction | BooleanFunction
	path: PubFieldPath
	arguments: LiteralValue[]
	pathTransform?: TransformFunction
}

export interface LogicalCondition {
	type: "logical"
	operator: LogicalOperator
	conditions: ParsedCondition[]
}

export interface NotCondition {
	type: "not"
	condition: ParsedCondition
}

export interface SearchCondition {
	type: "search"
	query: string
}

// relation context condition types (for filters inside relation queries)
export interface RelationComparisonCondition {
	type: "relationComparison"
	path: RelationContextPath
	operator: ComparisonOperator
	value: LiteralValue
	pathTransform?: TransformFunction
}

export interface RelationFunctionCondition {
	type: "relationFunction"
	name: StringFunction | BooleanFunction
	path: RelationContextPath
	arguments: LiteralValue[]
	pathTransform?: TransformFunction
}

export interface RelationLogicalCondition {
	type: "relationLogical"
	operator: LogicalOperator
	conditions: RelationFilterCondition[]
}

export interface RelationNotCondition {
	type: "relationNot"
	condition: RelationFilterCondition
}

export type RelationFilterCondition =
	| RelationComparisonCondition
	| RelationFunctionCondition
	| RelationLogicalCondition
	| RelationNotCondition

export type RelationDirection = "out" | "in"

export interface RelationCondition {
	type: "relation"
	direction: RelationDirection
	fieldSlug: string
	filter?: RelationFilterCondition
}

export type ParsedCondition =
	| ComparisonCondition
	| FunctionCondition
	| LogicalCondition
	| NotCondition
	| SearchCondition
	| RelationCondition

// type guards
export function isComparisonOp(op: string): op is ComparisonOperator {
	return (COMPARISON_OPS as readonly string[]).includes(op)
}

export function isLogicalOp(op: string): op is LogicalOperator {
	return (LOGICAL_OPS as readonly string[]).includes(op)
}

export function isStringFunction(name: string): name is StringFunction {
	return (STRING_FUNCTIONS as readonly string[]).includes(name)
}

export function isTransformFunction(name: string): name is TransformFunction {
	return (TRANSFORM_FUNCTIONS as readonly string[]).includes(name)
}

export function isBooleanFunction(name: string): name is BooleanFunction {
	return (BOOLEAN_FUNCTIONS as readonly string[]).includes(name)
}

// re-export for convenience
export type { ParsedCondition as Condition }
