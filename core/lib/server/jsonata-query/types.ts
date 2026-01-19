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

// our internal representation
export type ComparisonOperator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "in"
export type LogicalOperator = "and" | "or"
export type StringFunction = "contains" | "startsWith" | "endsWith" | "lowercase" | "uppercase"
export type BooleanFunction = "exists" | "not"

export type PubFieldPath =
	| { kind: "value"; fieldSlug: string }
	| { kind: "builtin"; field: "id" | "createdAt" | "updatedAt" | "pubTypeId" }
	| { kind: "pubType"; field: "name" | "id" }

export type LiteralValue = string | number | boolean | null | LiteralValue[]

export interface ComparisonCondition {
	type: "comparison"
	path: PubFieldPath
	operator: ComparisonOperator
	value: LiteralValue
	// when we have function wrappers like $lowercase($.pub.values.title)
	pathTransform?: StringFunction
}

export interface FunctionCondition {
	type: "function"
	name: StringFunction | BooleanFunction
	path: PubFieldPath
	arguments: LiteralValue[]
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

export type ParsedCondition =
	| ComparisonCondition
	| FunctionCondition
	| LogicalCondition
	| NotCondition

// re-export for convenience (also exported from parser.ts)
export type { ParsedCondition as Condition }
