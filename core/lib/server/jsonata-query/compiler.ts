import type { ParsedCondition } from "./parser"

import { parseJsonataQuery } from "./parser"

export interface CompiledQuery {
	condition: ParsedCondition
	originalExpression: string
}

/**
 * compiles a jsonata expression into a query that can be used for
 * both sql generation and in-memory filtering
 */
export function compileJsonataQuery(expression: string): CompiledQuery {
	const parsed = parseJsonataQuery(expression)
	return {
		condition: parsed.condition,
		originalExpression: expression,
	}
}
