import type { ProcessedPub } from "contracts"
import type { CompiledQuery } from "./compiler"
import type {
	ComparisonCondition,
	FunctionCondition,
	LogicalCondition,
	NotCondition,
	ParsedCondition,
	PubFieldPath,
	RelationCondition,
	RelationContextPath,
	RelationFilterCondition,
	SearchCondition,
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
 * evaluates a search condition against a pub
 * searches across all string values in the pub
 */
function evaluateSearch(pub: AnyProcessedPub, condition: SearchCondition): boolean {
	const { query } = condition
	const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (searchTerms.length === 0) {
		return true
	}

	// collect all searchable text from the pub
	const searchableTexts: string[] = []

	for (const v of pub.values) {
		if (typeof v.value === "string") {
			searchableTexts.push(v.value.toLowerCase())
		} else if (Array.isArray(v.value)) {
			for (const item of v.value) {
				if (typeof item === "string") {
					searchableTexts.push(item.toLowerCase())
				}
			}
		}
	}

	// all terms must match somewhere
	return searchTerms.every((term) => searchableTexts.some((text) => text.includes(term)))
}

// ============================================================================
// relation filter evaluation
// ============================================================================

interface RelationContext {
	relationValue: unknown
	relatedPub: AnyProcessedPub
}

/**
 * extracts a value from relation context based on path
 */
function getRelationContextValue(ctx: RelationContext, path: RelationContextPath): unknown {
	switch (path.kind) {
		case "relationValue":
			return ctx.relationValue
		case "relatedPubValue": {
			const value = ctx.relatedPub.values.find((v) => {
				const fieldSlug = v.fieldSlug
				return fieldSlug === path.fieldSlug || fieldSlug.endsWith(`:${path.fieldSlug}`)
			})
			return value?.value
		}
		case "relatedPubBuiltin":
			switch (path.field) {
				case "id":
					return ctx.relatedPub.id
				case "createdAt":
					return ctx.relatedPub.createdAt
				case "updatedAt":
					return ctx.relatedPub.updatedAt
				case "pubTypeId":
					return ctx.relatedPub.pubTypeId
			}
			break
		case "relatedPubType": {
			const pubType = (ctx.relatedPub as any).pubType
			return pubType?.[path.field]
		}
	}
	return undefined
}

/**
 * evaluates a relation filter condition against a relation context
 */
function evaluateRelationFilter(ctx: RelationContext, filter: RelationFilterCondition): boolean {
	switch (filter.type) {
		case "relationComparison": {
			let value = getRelationContextValue(ctx, filter.path)
			value = applyTransform(value, filter.pathTransform)
			return compareValues(value, filter.operator, filter.value)
		}
		case "relationFunction": {
			const value = getRelationContextValue(ctx, filter.path)
			const args = filter.arguments
			switch (filter.name) {
				case "contains":
					if (typeof value === "string") {
						return value.includes(String(args[0]))
					}
					if (Array.isArray(value)) {
						return value.includes(args[0])
					}
					return false
				case "startsWith":
					return typeof value === "string" && value.startsWith(String(args[0]))
				case "endsWith":
					return typeof value === "string" && value.endsWith(String(args[0]))
				case "exists":
					return value !== undefined && value !== null
				default:
					throw new UnsupportedExpressionError(
						`unsupported function in relation filter: ${filter.name}`
					)
			}
		}
		case "relationLogical":
			if (filter.operator === "and") {
				return filter.conditions.every((c) => evaluateRelationFilter(ctx, c))
			}
			return filter.conditions.some((c) => evaluateRelationFilter(ctx, c))
		case "relationNot":
			return !evaluateRelationFilter(ctx, filter.condition)
	}
}

/**
 * evaluates a relation condition against a pub
 *
 * for "out" relations: check if pub has any values pointing to related pubs matching the filter
 * for "in" relations: check if any related pubs point to this pub and match the filter
 */
function evaluateRelation(pub: AnyProcessedPub, condition: RelationCondition): boolean {
	const { direction, fieldSlug, filter } = condition

	if (direction === "out") {
		// find relation values from this pub
		const relationValues = pub.values.filter((v) => {
			const matchesSlug = v.fieldSlug === fieldSlug || v.fieldSlug.endsWith(`:${fieldSlug}`)
			return matchesSlug && v.relatedPub
		})

		if (relationValues.length === 0) {
			return false
		}

		// check if any related pub matches the filter
		return relationValues.some((rv) => {
			if (!filter) {
				return true
			}
			const ctx: RelationContext = {
				relationValue: rv.value,
				relatedPub: rv.relatedPub as AnyProcessedPub,
			}
			return evaluateRelationFilter(ctx, filter)
		})
	}

	// for "in" relations, we need to check children
	// this requires the pub to have children loaded
	const children = (pub as any).children as AnyProcessedPub[] | undefined
	if (!children || children.length === 0) {
		return false
	}

	// find children that are connected via this field
	return children.some((child) => {
		const relationValues = child.values.filter((v) => {
			const matchesSlug = v.fieldSlug === fieldSlug || v.fieldSlug.endsWith(`:${fieldSlug}`)
			return matchesSlug && v.relatedPubId === pub.id
		})

		if (relationValues.length === 0) {
			return false
		}

		if (!filter) {
			return true
		}

		return relationValues.some((rv) => {
			const ctx: RelationContext = {
				relationValue: rv.value,
				relatedPub: child,
			}
			return evaluateRelationFilter(ctx, filter)
		})
	})
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
		case "search":
			return evaluateSearch(pub, condition)
		case "relation":
			return evaluateRelation(pub, condition)
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
