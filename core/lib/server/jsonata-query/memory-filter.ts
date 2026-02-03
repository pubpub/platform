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
	StringFunction,
	TransformFunction,
} from "./types"

import {
	applyMemoryTransform,
	evaluateMemoryComparison,
	evaluateMemoryExists,
	evaluateMemoryStringFunction,
} from "./operators"

type AnyProcessedPub = ProcessedPub<any>

// value extraction

function getValueFromPubPath(pub: AnyProcessedPub, path: PubFieldPath): unknown {
	switch (path.kind) {
		case "builtin":
			switch (path.field) {
				case "id":
					return pub.id
				case "createdAt":
					return pub.createdAt
				case "updatedAt":
					return pub.updatedAt
				case "pubTypeId":
					return pub.pubTypeId
				case "title":
					return pub.title
				case "stageId":
					return pub.stageId
			}
			break
		case "pubType": {
			const pubType = (pub as any).pubType
			if (!pubType) {
				return undefined
			}
			return pubType[path.field]
		}
		case "value": {
			const value = pub.values.find((v) => {
				const fieldSlug = v.fieldSlug
				return fieldSlug === path.fieldSlug || fieldSlug.endsWith(`:${path.fieldSlug}`)
			})
			return value?.value
		}
	}
}

interface RelationContext {
	relationValue: unknown
	relatedPub: AnyProcessedPub
}

function getValueFromRelationPath(ctx: RelationContext, path: RelationContextPath): unknown {
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
				case "title":
					return ctx.relatedPub.title
				case "stageId":
					return ctx.relatedPub.stageId
			}
			break
		case "relatedPubType": {
			const pubType = (ctx.relatedPub as any).pubType
			return pubType?.[path.field]
		}
	}
}

// condition evaluation (uses shared operators)

function evaluateComparison(pub: AnyProcessedPub, condition: ComparisonCondition): boolean {
	let value = getValueFromPubPath(pub, condition.path)
	value = applyMemoryTransform(value, condition.pathTransform)
	return evaluateMemoryComparison(value, condition.operator, condition.value)
}

function evaluateFunction(pub: AnyProcessedPub, condition: FunctionCondition): boolean {
	const value = getValueFromPubPath(pub, condition.path)

	if (condition.name === "exists") {
		return evaluateMemoryExists(value)
	}

	return evaluateMemoryStringFunction(
		condition.name as StringFunction,
		value,
		condition.arguments[0],
		condition.pathTransform
	)
}

function evaluateLogical(pub: AnyProcessedPub, condition: LogicalCondition): boolean {
	if (condition.operator === "and") {
		return condition.conditions.every((c) => evaluateCondition(pub, c))
	}
	return condition.conditions.some((c) => evaluateCondition(pub, c))
}

function evaluateNot(pub: AnyProcessedPub, condition: NotCondition): boolean {
	return !evaluateCondition(pub, condition.condition)
}

function evaluateSearch(pub: AnyProcessedPub, query: string): boolean {
	const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (searchTerms.length === 0) {
		return true
	}

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

	return searchTerms.every((term) => searchableTexts.some((text) => text.includes(term)))
}

// relation filter evaluation

function evaluateRelationComparison(
	ctx: RelationContext,
	path: RelationContextPath,
	operator: string,
	value: unknown,
	transform?: TransformFunction
): boolean {
	let extractedValue = getValueFromRelationPath(ctx, path)
	extractedValue = applyMemoryTransform(extractedValue, transform)
	return evaluateMemoryComparison(extractedValue, operator as any, value)
}

function evaluateRelationFunction(
	ctx: RelationContext,
	path: RelationContextPath,
	funcName: string,
	args: unknown[],
	transform?: TransformFunction
): boolean {
	const value = getValueFromRelationPath(ctx, path)

	if (funcName === "exists") {
		return evaluateMemoryExists(value)
	}

	return evaluateMemoryStringFunction(funcName as StringFunction, value, args[0], transform)
}

function evaluateRelationFilter(ctx: RelationContext, filter: RelationFilterCondition): boolean {
	switch (filter.type) {
		case "relationComparison":
			return evaluateRelationComparison(
				ctx,
				filter.path,
				filter.operator,
				filter.value,
				filter.pathTransform
			)
		case "relationFunction":
			return evaluateRelationFunction(
				ctx,
				filter.path,
				filter.name,
				filter.arguments,
				filter.pathTransform
			)
		case "relationLogical":
			if (filter.operator === "and") {
				return filter.conditions.every((c) => evaluateRelationFilter(ctx, c))
			}
			return filter.conditions.some((c) => evaluateRelationFilter(ctx, c))
		case "relationNot":
			return !evaluateRelationFilter(ctx, filter.condition)
	}
}

function evaluateRelation(pub: AnyProcessedPub, condition: RelationCondition): boolean {
	const { direction, fieldSlug, filter } = condition

	if (direction === "out") {
		const relationValues = pub.values.filter((v) => {
			const matchesSlug = v.fieldSlug === fieldSlug || v.fieldSlug.endsWith(`:${fieldSlug}`)
			return matchesSlug && v.relatedPub
		})

		if (relationValues.length === 0) {
			return false
		}

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

	const children = (pub as any).children as AnyProcessedPub[] | undefined
	if (!children || children.length === 0) {
		return false
	}

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

// main dispatcher

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
			return evaluateSearch(pub, condition.query)
		case "relation":
			return evaluateRelation(pub, condition)
	}
}

// public api

export function filterPubsWithJsonata<T extends AnyProcessedPub>(
	pubs: T[],
	query: CompiledQuery
): T[] {
	return pubs.filter((pub) => evaluateCondition(pub, query.condition))
}

export function pubMatchesJsonataQuery(pub: AnyProcessedPub, query: CompiledQuery): boolean {
	return evaluateCondition(pub, query.condition)
}
