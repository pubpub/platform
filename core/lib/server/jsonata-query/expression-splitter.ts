// splits a full quata expression into query and projection parts
//
// query part: filter, sort, limit -> compiled to SQL
// projection part: transformation -> evaluated in-memory via JSONata against pub proxy
//
// example:
//   input:  $$pubs[status = 'published']^(>createdAt)[[0..9]].{ "title": values.title }
//   query:  $$pubs[status = 'published']^(>createdAt)[[0..9]]
//   projection: { "title": values.title }

import type { ExprNode } from "@pubpub/quata"

import { parseExpression } from "@pubpub/quata"

export interface SplitExpression {
	// the full original expression
	original: string
	// the query part (filter/sort/limit), or the full expression if no projection
	queryExpression: string
	// the projection part as a jsonata expression string, or null if no projection
	projectionExpression: string | null
	// whether the expression contains a projection
	hasProjection: boolean
}

// split a quata expression into query and projection parts
export function splitExpression(expression: string): SplitExpression {
	const ast = parseExpression(expression)

	if (ast.type !== "path") {
		// not a path expression, so no projection to split
		return {
			original: expression,
			queryExpression: expression,
			projectionExpression: null,
			hasProjection: false,
		}
	}

	const pathNode = ast as unknown as { steps: Array<Record<string, any>> }
	const steps = pathNode.steps

	if (steps.length === 0) {
		return {
			original: expression,
			queryExpression: expression,
			projectionExpression: null,
			hasProjection: false,
		}
	}

	// the projection is the last step if it's an object constructor
	// or a block containing an object constructor
	const lastStep = steps[steps.length - 1]
	const isProjection =
		(lastStep.type === "unary" && lastStep.value === "{") ||
		lastStep.type === "block"

	if (!isProjection) {
		return {
			original: expression,
			queryExpression: expression,
			projectionExpression: null,
			hasProjection: false,
		}
	}

	// find where the projection starts in the original string
	// the projection is a `.{...}` or `.(...)` at the end
	const projectionStart = findProjectionStart(expression, lastStep)

	if (projectionStart === -1) {
		return {
			original: expression,
			queryExpression: expression,
			projectionExpression: null,
			hasProjection: false,
		}
	}

	const queryPart = expression.slice(0, projectionStart).trimEnd()
	// remove the leading dot if present
	let projPart = expression.slice(projectionStart).trimStart()
	if (projPart.startsWith(".")) {
		projPart = projPart.slice(1)
	}

	// wrap the projection so it evaluates against each item
	// the in-memory evaluator will apply this to each pub via the pub proxy
	// the $ prefix references the current item
	const projectionExpression = projPart

	return {
		original: expression,
		queryExpression: queryPart,
		projectionExpression,
		hasProjection: true,
	}
}

// find the character position where the projection starts in the expression
// uses the ast position metadata to locate the projection
function findProjectionStart(expression: string, projectionNode: Record<string, any>): number {
	// the ast position gives us the position of the first token of the node
	// for unary nodes (object constructors), this is the position of `{`
	if (projectionNode.position !== undefined) {
		// jsonata positions are 1-based
		const pos = (projectionNode.position as number) - 1

		// walk backwards from the position to find the dot separator
		let dotPos = pos
		while (dotPos > 0 && expression[dotPos - 1] === ".") {
			dotPos--
		}
		// also handle whitespace before dot
		while (dotPos > 0 && expression[dotPos - 1] === " ") {
			dotPos--
		}
		if (dotPos > 0 && expression[dotPos - 1] === ".") {
			dotPos--
		}
		return dotPos
	}

	// fallback: scan backwards from the end for the `.{` or `.(` pattern
	const lastBrace = expression.lastIndexOf(".{")
	if (lastBrace !== -1) return lastBrace

	const lastParen = expression.lastIndexOf(".(")
	if (lastParen !== -1) return lastParen

	return -1
}
