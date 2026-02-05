import type {
	ArrayConstructorNode,
	BinaryNode,
	BlockNode,
	ConditionNode,
	FunctionNode,
	NegationNode,
	ObjectConstructorNode,
	PathNode,
	SortNode,
	UnaryNode,
	VariableNode,
} from "./jsonata.overrides.js"

import jsonata from "jsonata"

import { getFunctionMapping } from "./function-mapping.js"
import {
	BINARY_OPERATOR_CLASSIFICATION,
	NODE_TYPE_CLASSIFICATION,
	PATH_EXTENSION_CLASSIFICATION,
	SupportTier,
} from "./node-classification.js"

export interface ValidationError {
	message: string
	nodeType: string
	position?: number
	path: string[]
}

export interface ValidationResult {
	valid: boolean
	errors: ValidationError[]
	warnings: string[]
}

// using any for node types since the jsonata types don't fully match runtime
type AstNode = jsonata.ExprNode | { type: string; [key: string]: unknown }

// validate an entire expression
export function validateExpression(expr: string): ValidationResult {
	const errors: ValidationError[] = []
	const warnings: string[] = []

	let ast: AstNode
	try {
		ast = jsonata(expr).ast() as AstNode
	} catch (e) {
		return {
			valid: false,
			errors: [
				{
					message: `Parse error: ${(e as Error).message}`,
					nodeType: "error",
					path: [],
				},
			],
			warnings: [],
		}
	}

	validateNode(ast, [], errors, warnings)

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	}
}

// recursively validate a node
function validateNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const nodeType = node.type as string
	const classification =
		NODE_TYPE_CLASSIFICATION[nodeType as keyof typeof NODE_TYPE_CLASSIFICATION]

	if (!classification) {
		// unknown node type
		warnings.push(`Unknown node type '${nodeType}' at ${path.join(".")}`)
		return
	}

	if (classification.tier === SupportTier.UNSUPPORTED) {
		errors.push({
			message: `Node type '${nodeType}' is not supported: ${classification.notes}`,
			nodeType,
			position: (node as { position?: number }).position,
			path,
		})
		return
	}

	if (classification.tier === SupportTier.CONTEXTUAL) {
		warnings.push(
			`Node type '${nodeType}' at ${path.join(".")} has contextual support: ${classification.notes}`
		)
	}

	// type-specific validation
	switch (nodeType) {
		case "binary":
			validateBinaryNode(node, path, errors, warnings)
			break
		case "path":
			validatePathNode(node, path, errors, warnings)
			break
		case "function":
			validateFunctionNode(node, path, errors, warnings)
			break
		case "unary":
			validateUnaryNode(node, path, errors, warnings)
			break
		case "condition":
			validateConditionNode(node, path, errors, warnings)
			break
		case "block":
			validateBlockNode(node, path, errors, warnings)
			break
		case "variable":
			validateVariableNode(node, path, errors, warnings)
			break
		case "sort":
			validateSortNode(node, path, errors, warnings)
			break
		default:
			// literals and simple nodes are fine
			break
	}
}

function validateBinaryNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const binaryNode = node as unknown as BinaryNode
	const opClassification = BINARY_OPERATOR_CLASSIFICATION[binaryNode.value]

	if (!opClassification) {
		errors.push({
			message: `Unknown binary operator '${binaryNode.value}'`,
			nodeType: "binary",
			position: binaryNode.position,
			path,
		})
		return
	}

	if (opClassification.tier === SupportTier.UNSUPPORTED) {
		errors.push({
			message: `Binary operator '${binaryNode.value}' is not supported`,
			nodeType: "binary",
			position: binaryNode.position,
			path,
		})
		return
	}

	if (opClassification.constraints) {
		for (const constraint of opClassification.constraints) {
			warnings.push(`Operator '${binaryNode.value}': ${constraint}`)
		}
	}

	validateNode(binaryNode.lhs as AstNode, [...path, "lhs"], errors, warnings)
	validateNode(binaryNode.rhs as AstNode, [...path, "rhs"], errors, warnings)
}

function validatePathNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const pathNode = node as unknown as PathNode

	// check for unsupported path extensions
	if (pathNode.seekingParent && pathNode.seekingParent.length > 0) {
		errors.push({
			message: "Parent operator (%) references are not supported",
			nodeType: "path",
			position: pathNode.position,
			path,
		})
	}

	if (pathNode.tuple) {
		warnings.push("Path with tuple streaming may have limited support")
	}

	const steps = pathNode.steps || []
	for (let i = 0; i < steps.length; i++) {
		const step = steps[i] as AstNode & Record<string, unknown>
		const stepPath = [...path, `steps[${i}]`]

		// check for sort node in step
		if (step.type === "sort") {
			validateSortNode(step, stepPath, errors, warnings)
			continue
		}

		// validate the step expression itself
		validateNode(step, stepPath, errors, warnings)

		// check path step extensions
		if (step.focus) {
			if (!PATH_EXTENSION_CLASSIFICATION.focus.supported) {
				errors.push({
					message: `Focus binding (@) is not supported: ${PATH_EXTENSION_CLASSIFICATION.focus.notes}`,
					nodeType: "path",
					position: step.position as number | undefined,
					path: stepPath,
				})
			}
		}

		if (step.index) {
			if (!PATH_EXTENSION_CLASSIFICATION.index.supported) {
				errors.push({
					message: `Index binding (#) is not supported: ${PATH_EXTENSION_CLASSIFICATION.index.notes}`,
					nodeType: "path",
					position: step.position as number | undefined,
					path: stepPath,
				})
			}
		}

		if (step.ancestor) {
			errors.push({
				message: "Ancestor reference (%) is not supported",
				nodeType: "path",
				position: step.position as number | undefined,
				path: stepPath,
			})
		}

		// validate filter stages
		const stages = step.stages as
			| Array<{ type: string; expr?: AstNode; position?: number }>
			| undefined
		if (stages) {
			for (let j = 0; j < stages.length; j++) {
				const stage = stages[j]
				if (stage.type === "filter" && stage.expr) {
					validateNode(stage.expr, [...stepPath, `stages[${j}].expr`], errors, warnings)
				} else if (stage.type === "index") {
					errors.push({
						message: "Index stage (#) is not supported in filters",
						nodeType: "path",
						position: stage.position,
						path: [...stepPath, `stages[${j}]`],
					})
				}
			}
		}

		const predicate = step.predicate as Array<{ type: string; expr: AstNode }> | undefined
		if (predicate) {
			for (let j = 0; j < predicate.length; j++) {
				const pred = predicate[j]
				validateNode(pred.expr, [...stepPath, `predicate[${j}].expr`], errors, warnings)
			}
		}

		const group = step.group as { lhs: [AstNode, AstNode][] } | undefined
		if (group) {
			// group expressions become GROUP BY
			for (let j = 0; j < group.lhs.length; j++) {
				const [key, value] = group.lhs[j]
				validateNode(key, [...stepPath, `group[${j}].key`], errors, warnings)
				validateNode(value, [...stepPath, `group[${j}].value`], errors, warnings)
			}
		}
	}
}

function validateFunctionNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const funcNode = node as unknown as FunctionNode

	// get the function name
	let functionName: string | null = null
	const procedure = funcNode.procedure as AstNode

	if (procedure.type === "variable") {
		functionName = (procedure as unknown as VariableNode).value
	} else if (procedure.type === "path") {
		// could be a path to a function, not supported
		errors.push({
			message: "Function references via paths are not supported",
			nodeType: "function",
			position: funcNode.position,
			path,
		})
		return
	}

	if (functionName) {
		const mapping = getFunctionMapping(functionName)

		if (!mapping) {
			// unknown function - might be user-defined
			warnings.push(
				`Unknown function '$${functionName}' - user-defined functions are not supported in SQL translation`
			)
		} else if (mapping.tier === SupportTier.UNSUPPORTED) {
			errors.push({
				message: `Function '$${functionName}' is not supported: ${mapping.notes}`,
				nodeType: "function",
				position: funcNode.position,
				path,
			})
		} else if (mapping.constraints) {
			for (const constraint of mapping.constraints) {
				warnings.push(`Function '$${functionName}': ${constraint}`)
			}
		}
	}

	// validate arguments
	const args = funcNode.arguments || []
	for (let i = 0; i < args.length; i++) {
		validateNode(args[i] as AstNode, [...path, `arguments[${i}]`], errors, warnings)
	}
}

function validateUnaryNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const unaryNode = node as unknown as UnaryNode

	if (unaryNode.value === "-") {
		// negation
		const negNode = unaryNode as NegationNode
		validateNode(negNode.expression as AstNode, [...path, "expression"], errors, warnings)
	} else if (unaryNode.value === "[") {
		// array constructor
		const arrNode = unaryNode as ArrayConstructorNode
		const expressions = arrNode.expressions || []
		for (let i = 0; i < expressions.length; i++) {
			validateNode(
				expressions[i] as AstNode,
				[...path, `expressions[${i}]`],
				errors,
				warnings
			)
		}
	} else if (unaryNode.value === "{") {
		// object constructor
		const objNode = unaryNode as ObjectConstructorNode
		const lhs = objNode.lhs || []
		for (let i = 0; i < lhs.length; i++) {
			const [key, value] = lhs[i]
			validateNode(key as AstNode, [...path, `lhs[${i}].key`], errors, warnings)
			validateNode(value as AstNode, [...path, `lhs[${i}].value`], errors, warnings)
		}
	}
}

function validateConditionNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const condNode = node as unknown as ConditionNode
	validateNode(condNode.condition as AstNode, [...path, "condition"], errors, warnings)
	validateNode(condNode.then as AstNode, [...path, "then"], errors, warnings)
	if (condNode.else) {
		validateNode(condNode.else as AstNode, [...path, "else"], errors, warnings)
	}
}

function validateBlockNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const blockNode = node as unknown as BlockNode
	const expressions = blockNode.expressions || []
	for (let i = 0; i < expressions.length; i++) {
		validateNode(expressions[i] as AstNode, [...path, `expressions[${i}]`], errors, warnings)
	}
}

function validateVariableNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const varNode = node as unknown as VariableNode
	const varName = varNode.value

	// special variables
	if (varName === "" || varName === "$") {
		// $ - root context, allowed
		return
	}

	if (varName === "input") {
		// $input - query parameters, allowed
		return
	}

	// other variables need to be CTEs or parameters
	warnings.push(`Variable '$${varName}' will need to be provided as a CTE or parameter`)
}

function validateSortNode(
	node: AstNode,
	path: string[],
	errors: ValidationError[],
	warnings: string[]
): void {
	const sortNode = node as unknown as SortNode
	const terms = sortNode.terms || []

	for (let i = 0; i < terms.length; i++) {
		const term = terms[i]
		validateNode(
			term.expression as AstNode,
			[...path, `terms[${i}].expression`],
			errors,
			warnings
		)
	}

	// validate stages on sort node
	const stages = sortNode.stages as
		| Array<{ type: string; expr?: AstNode; position?: number }>
		| undefined
	if (stages) {
		for (let i = 0; i < stages.length; i++) {
			const stage = stages[i]
			if (stage.type === "filter" && stage.expr) {
				validateNode(stage.expr, [...path, `stages[${i}].expr`], errors, warnings)
			} else if (stage.type === "index") {
				errors.push({
					message: "Index stage (#) is not supported",
					nodeType: "sort",
					position: stage.position,
					path: [...path, `stages[${i}]`],
				})
			}
		}
	}
}

// check if an expression is fully supported (no errors or warnings)
export function isFullySupported(expr: string): boolean {
	const result = validateExpression(expr)
	return result.valid && result.warnings.length === 0
}

// check if an expression is valid (may have warnings but no errors)
export function isValid(expr: string): boolean {
	return validateExpression(expr).valid
}
