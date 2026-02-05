// quata - jsonata to sql translation library
// main entry point

// ast types (for advanced usage)
export type {
	BinaryNode,
	BindNode,
	BlockNode,
	ConditionNode,
	ExprNode,
	FilterStage,
	FunctionNode,
	NameNode,
	NumberNode,
	PathNode,
	SortNode,
	StringNode,
	UnaryNode,
	ValueNode,
	VariableNode,
} from "./jsonata.overrides.js"
export type {
	CompiledQuery,
	Quata,
	QuataOptions,
	QuataSchema,
	TableSchema,
	TranslationContext,
} from "./quata.js"
export type {
	FieldDefinition,
	FieldNames,
	FieldType,
	RelationDefinition,
	RelationType,
	TableNames,
} from "./schema/types.js"
export type { ValidationError, ValidationResult } from "./subset-validator.js"
export type { BindingEntry, KyselyRef } from "./translator/context.js"
export type { TranslationResult } from "./translator/expression.js"

// function mapping (for reference)
export { getFunctionMapping, isFunctionSupported } from "./function-mapping.js"
// node classification (for reference)
export {
	BINARY_OPERATOR_CLASSIFICATION,
	NODE_TYPE_CLASSIFICATION,
	SupportTier,
} from "./node-classification.js"
// core api
export { createQuata, TranslationError } from "./quata.js"
// schema definition
export {
	defineSchema,
	defineTable,
} from "./schema/types.js"
// validation
export {
	isFullySupported,
	isValid,
	validateExpression,
} from "./subset-validator.js"
// translation utilities (for advanced usage)
export {
	addBinding,
	createChildContext,
	createContext,
	generateAlias,
	resolveBinding,
	resolveField,
	resolveTable,
} from "./translator/context.js"
export {
	resultToSql,
	translateExpression,
} from "./translator/expression.js"
