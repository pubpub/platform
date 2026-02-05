// Enhanced type definitions for jsonata AST analysis
// These extend the basic types from jsonata for our specific use case

// re-export jsonata for convenience
import jsonata from "jsonata"
export { jsonata }
export default jsonata

// ============================================================================
// Base Node Types
// ============================================================================

export interface BaseNode {
	position?: number
	value?: unknown
	keepArray?: boolean
}

export interface AncestorSlot {
	label: string
	level: number
	index: number
}

// ============================================================================
// Literal Nodes
// ============================================================================

export interface StringNode extends BaseNode {
	type: "string"
	value: string
}

export interface NumberNode extends BaseNode {
	type: "number"
	value: number
}

export interface ValueNode extends BaseNode {
	type: "value"
	value: boolean | null
}

export interface RegexNode extends BaseNode {
	type: "regex"
	value: RegExp
}

// ============================================================================
// Identifier Nodes
// ============================================================================

export interface NameNode extends BaseNode {
	type: "name"
	value: string
	tuple?: boolean
	ancestor?: AncestorSlot
}

export interface VariableNode extends BaseNode {
	type: "variable"
	value: string
}

// ============================================================================
// Wildcard Nodes
// ============================================================================

export interface WildcardNode extends BaseNode {
	type: "wildcard"
	value: "*"
	tuple?: boolean
	ancestor?: AncestorSlot
}

export interface DescendantNode extends BaseNode {
	type: "descendant"
	value: "**"
}

export interface ParentNode extends BaseNode {
	type: "parent"
	slot: AncestorSlot
}

// ============================================================================
// Operator Types
// ============================================================================

export type ArithmeticOperator = "+" | "-" | "*" | "/" | "%"
export type ComparisonOperator = "=" | "!=" | "<" | "<=" | ">" | ">="
export type BooleanOperator = "and" | "or"
export type StringOperator = "&"
export type RangeOperator = ".."
export type InclusionOperator = "in"

export type BinaryOperatorValue =
	| ArithmeticOperator
	| ComparisonOperator
	| BooleanOperator
	| StringOperator
	| RangeOperator
	| InclusionOperator

// ============================================================================
// Binary Expression Nodes
// ============================================================================

export interface BinaryNode extends BaseNode {
	type: "binary"
	value: BinaryOperatorValue
	lhs: ExprNode
	rhs: ExprNode
}

// ============================================================================
// Path Expression Nodes
// ============================================================================

export interface FilterStage {
	type: "filter"
	expr: ExprNode
	position?: number
}

export interface IndexStage {
	type: "index"
	value: string
	position?: number
}

export type Stage = FilterStage | IndexStage

export interface SortTerm {
	descending: boolean
	expression: ExprNode
}

export interface SortNode extends BaseNode {
	type: "sort"
	terms: SortTerm[]
	stages?: Stage[]
}

export interface GroupExpression {
	lhs: [ExprNode, ExprNode][]
	position?: number
}

export interface PathStepExtensions {
	stages?: Stage[]
	predicate?: FilterStage[]
	group?: GroupExpression
	focus?: string
	index?: string
	tuple?: boolean
	ancestor?: AncestorSlot
	keepArray?: boolean
	consarray?: boolean
	nextFunction?: string
}

export interface PathNode extends BaseNode {
	type: "path"
	steps: ((ExprNode & Partial<PathStepExtensions>) | SortNode)[]
	keepSingletonArray?: boolean
	tuple?: boolean
	seekingParent?: AncestorSlot[]
}

// ============================================================================
// Bind Expression
// ============================================================================

export interface BindNode extends BaseNode {
	type: "bind"
	value: ":="
	lhs: VariableNode
	rhs: ExprNode
}

// ============================================================================
// Apply Expression
// ============================================================================

export interface ApplyNode extends BaseNode {
	type: "apply"
	value: "~>"
	lhs: ExprNode
	rhs: ExprNode
}

// ============================================================================
// Unary Expression Nodes
// ============================================================================

export interface NegationNode extends BaseNode {
	type: "unary"
	value: "-"
	expression: ExprNode
}

export interface ArrayConstructorNode extends BaseNode {
	type: "unary"
	value: "["
	expressions: ExprNode[]
	consarray?: boolean
}

export interface ObjectConstructorNode extends BaseNode {
	type: "unary"
	value: "{"
	lhs: [ExprNode, ExprNode][]
}

export type UnaryNode = NegationNode | ArrayConstructorNode | ObjectConstructorNode

// ============================================================================
// Function Nodes
// ============================================================================

export interface FunctionNode extends BaseNode {
	type: "function"
	value: "("
	procedure: ExprNode
	arguments: ExprNode[]
	nextFunction?: string
}

export interface PartialPlaceholderNode extends BaseNode {
	type: "operator"
	value: "?"
}

export interface PartialNode extends BaseNode {
	type: "partial"
	value: "("
	procedure: ExprNode
	arguments: (ExprNode | PartialPlaceholderNode)[]
}

export interface LambdaArgument {
	type: "variable"
	value: string
	position?: number
}

export interface LambdaSignature {
	validate: (args: unknown[], context: unknown) => unknown[]
}

export interface LambdaNode extends BaseNode {
	type: "lambda"
	arguments: LambdaArgument[]
	body: ExprNode
	signature?: LambdaSignature
	thunk?: boolean
}

// ============================================================================
// Condition Node
// ============================================================================

export interface ConditionNode extends BaseNode {
	type: "condition"
	condition: ExprNode
	then: ExprNode
	else?: ExprNode
}

// ============================================================================
// Block Node
// ============================================================================

export interface BlockNode extends BaseNode {
	type: "block"
	expressions: ExprNode[]
	consarray?: boolean
}

// ============================================================================
// Transform Node
// ============================================================================

export interface TransformNode extends BaseNode {
	type: "transform"
	pattern: ExprNode
	update: ExprNode
	delete?: ExprNode
}

// ============================================================================
// Error Node
// ============================================================================

export interface JsonataError extends Error {
	code: string
	position: number
	token: string
	value?: unknown
	value2?: unknown
}

export interface ErrorNode extends BaseNode {
	type: "error"
	error: JsonataError
	lhs?: ExprNode
	remaining?: unknown[]
}

// ============================================================================
// Union Type of All Expression Nodes
// ============================================================================

export type ExprNode =
	| StringNode
	| NumberNode
	| ValueNode
	| RegexNode
	| NameNode
	| VariableNode
	| WildcardNode
	| DescendantNode
	| ParentNode
	| BinaryNode
	| PathNode
	| BindNode
	| ApplyNode
	| UnaryNode
	| FunctionNode
	| PartialNode
	| LambdaNode
	| ConditionNode
	| BlockNode
	| TransformNode
	| SortNode
	| ErrorNode

// all possible node type strings
export type AllNodeTypes =
	| "string"
	| "number"
	| "value"
	| "regex"
	| "name"
	| "variable"
	| "wildcard"
	| "descendant"
	| "parent"
	| "path"
	| "binary"
	| "bind"
	| "apply"
	| "unary"
	| "function"
	| "partial"
	| "lambda"
	| "condition"
	| "block"
	| "transform"
	| "sort"
	| "error"
