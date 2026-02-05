import type { AllNodeTypes, BinaryOperatorValue, PathStepExtensions } from "./jsonata.overrides.js"

// support tiers for sql translation
export const SupportTier = {
	// direct translation to sql with no special handling
	FULL: "full",
	// translatable but requires specific patterns or has edge cases
	PARTIAL: "partial",
	// only supported in specific contexts (eg parameter-only, or projection-only)
	CONTEXTUAL: "contextual",
	// not translatable to sql
	UNSUPPORTED: "unsupported",
} as const

export type SupportTier = (typeof SupportTier)[keyof typeof SupportTier]

export interface NodeClassification {
	tier: SupportTier
	sqlEquivalent?: string
	notes: string
	constraints?: string[]
}

// classification of all jsonata node types
export const NODE_TYPE_CLASSIFICATION: Record<AllNodeTypes, NodeClassification> = {
	// literals - all fully supported
	string: {
		tier: SupportTier.FULL,
		sqlEquivalent: "string literal",
		notes: "direct mapping to sql string literals",
	},
	number: {
		tier: SupportTier.FULL,
		sqlEquivalent: "numeric literal",
		notes: "direct mapping to sql numeric literals",
	},
	value: {
		tier: SupportTier.FULL,
		sqlEquivalent: "TRUE/FALSE/NULL",
		notes: "boolean and null literals map directly",
	},
	regex: {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "~ or ~* operators, REGEXP_MATCHES",
		notes: "postgres supports regex but with different syntax and capabilities",
		constraints: [
			"some regex features may not translate exactly",
			"flags handling differs between jsonata and postgres",
		],
	},

	// identifiers
	name: {
		tier: SupportTier.FULL,
		sqlEquivalent: "column reference or jsonb path",
		notes: "field names become column references or jsonb accessors",
		constraints: [
			"must be a known column or jsonb path",
			"backtick-quoted names need special handling",
		],
	},
	variable: {
		tier: SupportTier.CONTEXTUAL,
		sqlEquivalent: "parameter binding, CTE reference, or table reference",
		notes: "$$ becomes table context, $input becomes parameters, other variables may become CTEs",
		constraints: [
			"$$ must be followed by table name",
			"$input.* becomes query parameters",
			"arbitrary variable names require CTE or parameter definition",
		],
	},

	// wildcards - mostly unsupported
	wildcard: {
		tier: SupportTier.UNSUPPORTED,
		notes: "* wildcard requires schema knowledge at compile time to expand to all columns",
		constraints: ["would need schema introspection to support"],
	},
	descendant: {
		tier: SupportTier.UNSUPPORTED,
		notes: "** recursive descent has no sql equivalent without recursive CTEs for known structures",
	},
	parent: {
		tier: SupportTier.UNSUPPORTED,
		notes: "% parent operator requires complex scoping that doesn't map to sql",
	},

	// paths
	path: {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "FROM/JOIN/WHERE/SELECT composition",
		notes: "path expressions form the core query structure",
		constraints: [
			"first step must establish table context",
			"subsequent steps can be column access, jsonb paths, or joins",
			"filter stages become WHERE clauses",
			"focus (@) and index (#) bindings are not supported",
		],
	},

	// binary operators
	binary: {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "varies by operator",
		notes: "most binary operators translate directly, some have constraints",
		constraints: [
			"range operator (..) needs generate_series",
			"in operator maps to IN or = ANY",
			"string & maps to ||",
		],
	},

	// variable binding
	bind: {
		tier: SupportTier.CONTEXTUAL,
		sqlEquivalent: "CTE (WITH clause)",
		notes: "variable binding can translate to CTEs in certain patterns",
		constraints: [
			"only useful for subquery extraction",
			"cannot bind arbitrary runtime values",
		],
	},

	// function application
	apply: {
		tier: SupportTier.UNSUPPORTED,
		notes: "~> operator has no sql equivalent, would need to be inlined at compile time",
	},

	// unary expressions (array/object constructors and negation)
	unary: {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "ARRAY[], json_build_object, or unary minus",
		notes: "depends on the specific unary operation",
		constraints: [
			"negation (-) fully supported",
			"array constructor needs ARRAY[] syntax",
			"object constructor needs json_build_object or projection syntax",
		],
	},

	// function calls
	function: {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "SQL functions (varies by function)",
		notes: "many built-in functions have sql equivalents, see function mapping",
		constraints: ["only whitelisted functions are supported"],
	},

	// partial application
	partial: {
		tier: SupportTier.UNSUPPORTED,
		notes: "partial function application has no sql equivalent",
	},

	// lambda definitions
	lambda: {
		tier: SupportTier.UNSUPPORTED,
		notes: "function definitions cannot be expressed in sql",
	},

	// conditional
	condition: {
		tier: SupportTier.FULL,
		sqlEquivalent: "CASE WHEN ... THEN ... ELSE ... END",
		notes: "ternary operator maps directly to CASE expression",
		constraints: ["all branches must be sql-expressible"],
	},

	// block expressions
	block: {
		tier: SupportTier.CONTEXTUAL,
		sqlEquivalent: "CTE chain or subquery",
		notes: "blocks with variable bindings can become CTEs",
		constraints: [
			"only the final expression determines the result",
			"intermediate bindings must form valid CTEs",
		],
	},

	// transform
	transform: {
		tier: SupportTier.UNSUPPORTED,
		notes: "transform operator is a mutation operation, not a query",
	},

	// sort
	sort: {
		tier: SupportTier.FULL,
		sqlEquivalent: "ORDER BY",
		notes: "sort terms map directly to ORDER BY clauses",
		constraints: ["sort expressions must be sql-expressible"],
	},

	// error
	error: {
		tier: SupportTier.UNSUPPORTED,
		notes: "error nodes indicate parse errors, not valid expressions",
	},
}

// binary operator support classification
export const BINARY_OPERATOR_CLASSIFICATION: Record<BinaryOperatorValue, NodeClassification> = {
	// arithmetic - all fully supported
	"+": {
		tier: SupportTier.FULL,
		sqlEquivalent: "+",
		notes: "direct mapping",
	},
	"-": {
		tier: SupportTier.FULL,
		sqlEquivalent: "-",
		notes: "direct mapping",
	},
	"*": {
		tier: SupportTier.FULL,
		sqlEquivalent: "*",
		notes: "direct mapping",
	},
	"/": {
		tier: SupportTier.FULL,
		sqlEquivalent: "/",
		notes: "direct mapping, note integer division behavior may differ",
	},
	"%": {
		tier: SupportTier.FULL,
		sqlEquivalent: "%",
		notes: "modulo operator maps directly",
	},

	// comparison - all fully supported
	"=": {
		tier: SupportTier.FULL,
		sqlEquivalent: "=",
		notes: "equality comparison",
		constraints: ["jsonata deep equality may not match sql for complex types"],
	},
	"!=": {
		tier: SupportTier.FULL,
		sqlEquivalent: "<> or !=",
		notes: "inequality comparison",
	},
	"<": {
		tier: SupportTier.FULL,
		sqlEquivalent: "<",
		notes: "less than",
	},
	"<=": {
		tier: SupportTier.FULL,
		sqlEquivalent: "<=",
		notes: "less than or equal",
	},
	">": {
		tier: SupportTier.FULL,
		sqlEquivalent: ">",
		notes: "greater than",
	},
	">=": {
		tier: SupportTier.FULL,
		sqlEquivalent: ">=",
		notes: "greater than or equal",
	},

	// boolean
	and: {
		tier: SupportTier.FULL,
		sqlEquivalent: "AND",
		notes: "logical and",
	},
	or: {
		tier: SupportTier.FULL,
		sqlEquivalent: "OR",
		notes: "logical or",
	},

	// string
	"&": {
		tier: SupportTier.FULL,
		sqlEquivalent: "||",
		notes: "string concatenation",
	},

	// range
	"..": {
		tier: SupportTier.PARTIAL,
		sqlEquivalent: "generate_series(start, end)",
		notes: "range operator maps to generate_series",
		constraints: ["both operands must be integers", "returns a set, may need array_agg"],
	},

	// inclusion
	in: {
		tier: SupportTier.FULL,
		sqlEquivalent: "IN (...) or = ANY(...)",
		notes: "membership test",
		constraints: ["rhs must be an array or subquery"],
	},
}

// path step extension support
export interface PathExtensionClassification {
	supported: boolean
	notes: string
}

export const PATH_EXTENSION_CLASSIFICATION: Record<
	keyof PathStepExtensions,
	PathExtensionClassification
> = {
	stages: {
		supported: true,
		notes: "filter stages become WHERE clauses, index stages are not supported",
	},
	predicate: {
		supported: true,
		notes: "predicates become WHERE clauses",
	},
	group: {
		supported: true,
		notes: "group expressions become GROUP BY with aggregation",
	},
	focus: {
		supported: false,
		notes: "@ focus binding requires complex scoping not available in sql",
	},
	index: {
		supported: false,
		notes: "# index binding would require ROW_NUMBER but with complex scoping",
	},
	tuple: {
		supported: false,
		notes: "internal optimization flag, not relevant for sql translation",
	},
	ancestor: {
		supported: false,
		notes: "ancestor binding for % operator is not supported",
	},
	keepArray: {
		supported: true,
		notes: "affects result wrapping, can be handled in post-processing",
	},
	consarray: {
		supported: false,
		notes: "array construction within paths has limited sql support",
	},
	nextFunction: {
		supported: false,
		notes: "function chaining syntax not supported",
	},
}

// helper to check if a node type is supported in any tier
export function isNodeTypeSupported(nodeType: AllNodeTypes): boolean {
	const classification = NODE_TYPE_CLASSIFICATION[nodeType]
	return classification.tier !== SupportTier.UNSUPPORTED
}

// helper to check if a binary operator is supported
export function isBinaryOperatorSupported(op: BinaryOperatorValue): boolean {
	const classification = BINARY_OPERATOR_CLASSIFICATION[op]
	return classification.tier !== SupportTier.UNSUPPORTED
}

// collect all unsupported node types
export function getUnsupportedNodeTypes(): AllNodeTypes[] {
	return (Object.entries(NODE_TYPE_CLASSIFICATION) as [AllNodeTypes, NodeClassification][])
		.filter(([_, c]) => c.tier === SupportTier.UNSUPPORTED)
		.map(([type]) => type)
}

// collect all fully supported node types
export function getFullySupportedNodeTypes(): AllNodeTypes[] {
	return (Object.entries(NODE_TYPE_CLASSIFICATION) as [AllNodeTypes, NodeClassification][])
		.filter(([_, c]) => c.tier === SupportTier.FULL)
		.map(([type]) => type)
}
