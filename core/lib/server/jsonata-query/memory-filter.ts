import type { ProcessedPub } from "contracts"
import type { CompiledQuery } from "./compiler"
import type {
	ComparisonCondition,
	FunctionCondition,
	LogicalCondition,
	NotCondition,
	ParsedCondition,
	PubFieldPath,
} from "./types"

import { UnsupportedExpressionError } from "./errors"

type AnyProcessedPub = ProcessedPub<any>

/**
 * extracts a value from a pub based on a field path
 */
function getValueFromPath(pub: AnyProcessedPub, path: PubFieldPath): unknown {
	if (path.kind === "builtin") {
		switch (path.field) {
			case "id":
				return pub.id
			case "createdAt":
				return pub.createdAt
			case "updatedAt":
				return pub.updatedAt
			case "pubTypeId":
				return pub.pubTypeId
		}
	}

	if (path.kind === "pubType") {
		const pubType = (pub as any).pubType
		if (!pubType) {
			return undefined
		}
		return pubType[path.field]
	}

	// value field - find in values array
	const value = pub.values.find((v) => {
		// handle both full slug and short slug
		const fieldSlug = v.fieldSlug
		return fieldSlug === path.fieldSlug || fieldSlug.endsWith(`:${path.fieldSlug}`)
	})

	return value?.value
}

/**
 * applies a path transform to a value
 */
function applyTransform(value: unknown, transform?: string): unknown {
	if (transform === "lowercase" && typeof value === "string") {
		return value.toLowerCase()
	}
	if (transform === "uppercase" && typeof value === "string") {
		return value.toUpperCase()
	}
	return value
}

/**
 * compares two values using the given operator
 */
function compareValues(left: unknown, operator: string, right: unknown): boolean {
	// handle null comparisons
	if (right === null) {
		if (operator === "=") {
			return left === null || left === undefined
		}
		if (operator === "!=") {
			return left !== null && left !== undefined
		}
	}

	// handle "in" operator
	if (operator === "in" && Array.isArray(right)) {
		return right.includes(left)
	}

	// convert dates for comparison
	const normalizeValue = (v: unknown): unknown => {
		if (v instanceof Date) {
			return v.getTime()
		}
		if (typeof v === "string") {
			const parsed = Date.parse(v)
			if (!isNaN(parsed) && v.includes("-")) {
				return parsed
			}
		}
		return v
	}

	const normalizedLeft = normalizeValue(left)
	const normalizedRight = normalizeValue(right)

	switch (operator) {
		case "=":
			return normalizedLeft === normalizedRight
		case "!=":
			return normalizedLeft !== normalizedRight
		case "<":
			return (normalizedLeft as number) < (normalizedRight as number)
		case "<=":
			return (normalizedLeft as number) <= (normalizedRight as number)
		case ">":
			return (normalizedLeft as number) > (normalizedRight as number)
		case ">=":
			return (normalizedLeft as number) >= (normalizedRight as number)
		default:
			throw new UnsupportedExpressionError(`unsupported operator: ${operator}`)
	}
}

/**
 * evaluates a comparison condition against a pub
 */
function evaluateComparison(pub: AnyProcessedPub, condition: ComparisonCondition): boolean {
	let value = getValueFromPath(pub, condition.path)
	value = applyTransform(value, condition.pathTransform)
	return compareValues(value, condition.operator, condition.value)
}

/**
 * evaluates a function condition against a pub
 */
function evaluateFunction(pub: AnyProcessedPub, condition: FunctionCondition): boolean {
	const value = getValueFromPath(pub, condition.path)
	const args = condition.arguments

	switch (condition.name) {
		case "contains": {
			if (typeof value === "string") {
				return value.includes(String(args[0]))
			}
			if (Array.isArray(value)) {
				return value.includes(args[0])
			}
			return false
		}
		case "startsWith": {
			if (typeof value !== "string") {
				return false
			}
			return value.startsWith(String(args[0]))
		}
		case "endsWith": {
			if (typeof value !== "string") {
				return false
			}
			return value.endsWith(String(args[0]))
		}
		case "exists": {
			return value !== undefined && value !== null
		}
		default:
			throw new UnsupportedExpressionError(`unsupported function: ${condition.name}`)
	}
}

/**
 * evaluates a logical condition against a pub
 */
function evaluateLogical(pub: AnyProcessedPub, condition: LogicalCondition): boolean {
	if (condition.operator === "and") {
		return condition.conditions.every((c) => evaluateCondition(pub, c))
	}
	return condition.conditions.some((c) => evaluateCondition(pub, c))
}

/**
 * evaluates a not condition against a pub
 */
function evaluateNot(pub: AnyProcessedPub, condition: NotCondition): boolean {
	return !evaluateCondition(pub, condition.condition)
}

/**
 * evaluates any condition against a pub
 */
function evaluateCondition(pub: AnyProcessedPub, condition: ParsedCondition): boolean {
	switch (condition.type) {
		case "comparison":
			return evaluateComparison(pub, condition)
		case "function":
			return evaluateFunction(pub, condition)
		case "logical":
			return evaluateLogical(pub, condition)
		case "not":
			return evaluateNot(pub, condition)
	}
}

/**
 * filters an array of pubs using a compiled jsonata query
 *
 * @example
 * ```ts
 * const query = compileJsonataQuery('$.pub.values.title = "Test" and $.pub.values.number > 10')
 * const filtered = filterPubsWithJsonata(pubs, query)
 * ```
 */
export function filterPubsWithJsonata<T extends AnyProcessedPub>(
	pubs: T[],
	query: CompiledQuery
): T[] {
	return pubs.filter((pub) => evaluateCondition(pub, query.condition))
}

/**
 * tests if a single pub matches a compiled jsonata query
 */
export function pubMatchesJsonataQuery(pub: AnyProcessedPub, query: CompiledQuery): boolean {
	return evaluateCondition(pub, query.condition)
}
