import type { ExpressionBuilder, ExpressionWrapper, RawBuilder } from "kysely"
import type { ComparisonOperator, StringFunction, TransformFunction } from "./types"

import { sql } from "kysely"

import { UnsupportedExpressionError } from "./errors"

type AnyExpressionBuilder = ExpressionBuilder<any, any>
type AnyExpressionWrapper = ExpressionWrapper<any, any, any>

// sql operator building

export function wrapJsonValue(value: unknown): unknown {
	if (typeof value === "string") {
		return JSON.stringify(value)
	}
	return value
}

export function applyColumnTransformForText(
	column: string,
	transform?: TransformFunction
): RawBuilder<unknown> {
	switch (transform) {
		case "lowercase":
			return sql.raw(`lower(${column}::text)`)
		case "uppercase":
			return sql.raw(`upper(${column}::text)`)
		default:
			return sql.raw(`${column}::text`)
	}
}

export function applySearchArgTransform(arg: string, transform?: TransformFunction): string {
	switch (transform) {
		case "lowercase":
			return arg.toLowerCase()
		case "uppercase":
			return arg.toUpperCase()
		default:
			return arg
	}
}

type SqlComparisonBuilder = (
	eb: AnyExpressionBuilder,
	column: string,
	value: unknown
) => AnyExpressionWrapper

const sqlComparisonMap = {
	"=": (eb, col, value) => eb(col, "=", value),
	"!=": (eb, col, value) => eb(col, "!=", value),
	"<": (eb, col, value) => eb(col, "<", value),
	"<=": (eb, col, value) => eb(col, "<=", value),
	">": (eb, col, value) => eb(col, ">", value),
	">=": (eb, col, value) => eb(col, ">=", value),
	in: (eb, col, value) => {
		if (Array.isArray(value)) {
			return eb(col, "in", value)
		}
		return eb(col, "=", value)
	},
} as const satisfies Record<ComparisonOperator, SqlComparisonBuilder>

export function buildSqlComparison(
	eb: AnyExpressionBuilder,
	column: string,
	operator: ComparisonOperator,
	value: unknown,
	isJsonValue: boolean,
	transform?: TransformFunction
): AnyExpressionWrapper {
	// for transforms (lowercase/uppercase), we need to cast to text and also wrap string values
	if (transform) {
		const colExpr = applyColumnTransformForText(column, transform)
		const wrappedValue = isJsonValue ? wrapJsonValue(value) : value
		const builder = sqlComparisonMap[operator]
		if (!builder) {
			throw new UnsupportedExpressionError(`unsupported operator: ${operator}`)
		}
		// transform function needs text comparison
		if (operator === "in" && Array.isArray(wrappedValue)) {
			return eb(colExpr, "in", isJsonValue ? wrappedValue.map(wrapJsonValue) : wrappedValue)
		}
		return builder(eb, colExpr as any, wrappedValue)
	}

	// no transform - use column directly, only wrap strings for json
	const wrappedValue = isJsonValue ? wrapJsonValue(value) : value
	const finalValue =
		operator === "in" && Array.isArray(wrappedValue) && isJsonValue
			? wrappedValue.map(wrapJsonValue)
			: wrappedValue

	const builder = sqlComparisonMap[operator]
	if (!builder) {
		throw new UnsupportedExpressionError(`unsupported operator: ${operator}`)
	}
	return builder(eb, column, finalValue)
}

type SqlStringFunctionBuilder = (
	eb: AnyExpressionBuilder,
	colExpr: RawBuilder<unknown>,
	searchArg: string,
	isJsonValue: boolean,
	hasTransform: boolean
) => AnyExpressionWrapper

const sqlStringFunctionMap = {
	contains: (eb, col, arg) => eb(col, "like", `%${arg}%`),
	startsWith: (eb, col, arg, isJson, hasTransform) => {
		// json strings start with a quote when no transform is applied
		if (isJson && !hasTransform) {
			return eb(col, "like", `"${arg}%`)
		}
		return eb(col, "like", `${arg}%`)
	},
	endsWith: (eb, col, arg, isJson, hasTransform) => {
		// json strings end with a quote when no transform is applied
		if (isJson && !hasTransform) {
			return eb(col, "like", `%${arg}"`)
		}
		return eb(col, "like", `%${arg}`)
	},
} as const satisfies Record<StringFunction, SqlStringFunctionBuilder>

export function buildSqlStringFunction(
	eb: AnyExpressionBuilder,
	column: string,
	funcName: StringFunction,
	arg: string,
	isJsonValue: boolean,
	transform?: TransformFunction
): AnyExpressionWrapper {
	const colExpr = applyColumnTransformForText(column, transform)
	const searchArg = applySearchArgTransform(arg, transform)

	const builder = sqlStringFunctionMap[funcName]
	if (!builder) {
		throw new UnsupportedExpressionError(`unsupported string function: ${funcName}`)
	}
	return builder(eb, colExpr, searchArg, isJsonValue, !!transform)
}

export function buildSqlExists(
	eb: AnyExpressionBuilder,
	column: string,
	isNullCheck: boolean
): AnyExpressionWrapper {
	if (isNullCheck) {
		return eb(column, "is not", null)
	}
	return eb.lit(true)
}

export function applyMemoryTransform(value: unknown, transform?: TransformFunction): unknown {
	if (typeof value !== "string") {
		return value
	}
	switch (transform) {
		case "lowercase":
			return value.toLowerCase()
		case "uppercase":
			return value.toUpperCase()
		default:
			return value
	}
}

function normalizeForComparison(v: unknown): unknown {
	if (v instanceof Date) {
		return v.getTime()
	}
	if (typeof v === "string") {
		const parsed = Date.parse(v)
		if (!Number.isNaN(parsed)) {
			return parsed
		}
	}
	return v
}

type MemoryComparisonFn = (left: unknown, right: unknown) => boolean

const memoryComparisonMap = {
	"=": (left, right) => {
		if (right === null) {
			return left === null || left === undefined
		}
		return normalizeForComparison(left) === normalizeForComparison(right)
	},
	"!=": (left, right) => {
		if (right === null) {
			return left !== null && left !== undefined
		}
		return normalizeForComparison(left) !== normalizeForComparison(right)
	},
	"<": (left, right) =>
		(normalizeForComparison(left) as number) < (normalizeForComparison(right) as number),
	"<=": (left, right) =>
		(normalizeForComparison(left) as number) <= (normalizeForComparison(right) as number),
	">": (left, right) =>
		(normalizeForComparison(left) as number) > (normalizeForComparison(right) as number),
	">=": (left, right) =>
		(normalizeForComparison(left) as number) >= (normalizeForComparison(right) as number),
	in: (left, right) => {
		if (Array.isArray(right)) {
			return right.includes(left)
		}
		return left === right
	},
} as const satisfies Record<ComparisonOperator, MemoryComparisonFn>

export function evaluateMemoryComparison(
	left: unknown,
	operator: ComparisonOperator,
	right: unknown
): boolean {
	const compareFn = memoryComparisonMap[operator]
	if (!compareFn) {
		throw new UnsupportedExpressionError(`unsupported operator: ${operator}`)
	}
	return compareFn(left, right)
}

type MemoryStringFunctionFn = (value: unknown, arg: unknown) => boolean

const memoryStringFunctionMap = {
	contains: (value, arg) => {
		if (typeof value === "string") {
			return value.includes(String(arg))
		}
		if (Array.isArray(value)) {
			return value.includes(arg)
		}
		return false
	},
	startsWith: (value, arg) => {
		if (typeof value !== "string") {
			return false
		}
		return value.startsWith(String(arg))
	},
	endsWith: (value, arg) => {
		if (typeof value !== "string") {
			return false
		}
		return value.endsWith(String(arg))
	},
} as const satisfies Record<StringFunction, MemoryStringFunctionFn>

export function evaluateMemoryStringFunction(
	funcName: StringFunction,
	value: unknown,
	arg: unknown,
	transform?: TransformFunction
): boolean {
	const transformedValue = applyMemoryTransform(value, transform)
	const transformedArg = typeof arg === "string" ? applyMemoryTransform(arg, transform) : arg

	const evalFn = memoryStringFunctionMap[funcName]
	if (!evalFn) {
		throw new UnsupportedExpressionError(`unsupported string function: ${funcName}`)
	}
	return evalFn(transformedValue, transformedArg)
}

export function evaluateMemoryExists(value: unknown): boolean {
	return value !== undefined && value !== null
}
