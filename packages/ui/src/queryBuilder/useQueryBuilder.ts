"use client"

import type {
	LogicalOperator,
	Operator,
	QueryMode,
	VisualCondition,
	VisualConditionGroup,
	VisualQuery,
} from "./types"

import { useCallback, useState } from "react"

// generate a unique id for conditions
function generateId(): string {
	return Math.random().toString(36).substring(2, 9)
}

// create an empty visual query
function createEmptyQuery(): VisualQuery {
	return {
		id: generateId(),
		type: "group",
		operator: "and",
		conditions: [],
	}
}

// create a new condition
function createCondition(path: string = ""): VisualCondition {
	return {
		id: generateId(),
		path,
		operator: "=",
		value: "",
	}
}

// convert a visual condition to jsonata expression
function conditionToJsonata(condition: VisualCondition): string {
	const { path, operator, value } = condition

	if (!path) {
		return ""
	}

	// handle boolean functions (no value needed)
	if (operator === "exists") {
		return `$exists(${path})`
	}

	// handle string functions
	if (operator === "contains" || operator === "startsWith" || operator === "endsWith") {
		const escapedValue = JSON.stringify(value)
		return `$${operator}(${path}, ${escapedValue})`
	}

	// handle comparison operators
	const escapedValue = isNaN(Number(value)) ? JSON.stringify(value) : value
	return `${path} ${operator} ${escapedValue}`
}

// convert a visual query group to jsonata expression
function queryToJsonata(query: VisualQuery): string {
	if (query.conditions.length === 0) {
		return ""
	}

	const expressions = query.conditions
		.map((item) => {
			if ("type" in item && item.type === "group") {
				const nested = queryToJsonata(item)
				return nested ? `(${nested})` : ""
			}
			return conditionToJsonata(item as VisualCondition)
		})
		.filter(Boolean)

	if (expressions.length === 0) {
		return ""
	}

	if (expressions.length === 1) {
		return expressions[0]
	}

	return expressions.join(` ${query.operator} `)
}

// try to parse a jsonata expression into a visual query
// returns null if the expression is too complex for visual editing
function parseJsonataToQuery(expression: string): VisualQuery | null {
	if (!expression.trim()) {
		return createEmptyQuery()
	}

	try {
		// simple regex-based parsing for common patterns
		// this is intentionally limited - complex expressions should use code mode

		// detect logical operator
		const andMatch = expression.match(/^(.+?)\s+and\s+(.+)$/i)
		const orMatch = expression.match(/^(.+?)\s+or\s+(.+)$/i)

		if (andMatch || orMatch) {
			const _match = andMatch || orMatch
			const operator: LogicalOperator = andMatch ? "and" : "or"
			const parts = splitByOperator(expression, operator)

			const conditions: (VisualCondition | VisualConditionGroup)[] = []
			for (const part of parts) {
				const parsed = parseSimpleCondition(part.trim())
				if (parsed) {
					conditions.push(parsed)
				} else {
					// if any part can't be parsed, return null
					return null
				}
			}

			return {
				id: generateId(),
				type: "group",
				operator,
				conditions,
			}
		}

		// try to parse as a single condition
		const condition = parseSimpleCondition(expression)
		if (condition) {
			return {
				id: generateId(),
				type: "group",
				operator: "and",
				conditions: [condition],
			}
		}

		return null
	} catch {
		return null
	}
}

// split expression by logical operator, respecting parentheses
function splitByOperator(expression: string, operator: LogicalOperator): string[] {
	const parts: string[] = []
	let current = ""
	let depth = 0
	const regex = new RegExp(`\\s+${operator}\\s+`, "gi")

	let lastIndex = 0
	let match: RegExpExecArray | null

	// biome-ignore lint/suspicious/noAssignInExpressions: no it's fine
	while ((match = regex.exec(expression)) !== null) {
		const beforeMatch = expression.substring(lastIndex, match.index)
		depth += (beforeMatch.match(/\(/g) || []).length - (beforeMatch.match(/\)/g) || []).length

		if (depth === 0) {
			parts.push(current + beforeMatch)
			current = ""
		} else {
			current += beforeMatch + match[0]
		}
		lastIndex = match.index + match[0].length
	}

	parts.push(current + expression.substring(lastIndex))
	return parts.filter((p) => p.trim())
}

// parse a simple condition expression
function parseSimpleCondition(expression: string): VisualCondition | null {
	const trimmed = expression.trim()

	// handle parentheses
	if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
		return parseSimpleCondition(trimmed.slice(1, -1))
	}

	// handle $exists(path)
	const existsMatch = trimmed.match(/^\$exists\(([^)]+)\)$/)
	if (existsMatch) {
		return {
			id: generateId(),
			path: existsMatch[1].trim(),
			operator: "exists",
			value: "",
		}
	}

	// handle string functions: $contains(path, value), $startsWith(path, value), $endsWith(path, value)
	const funcMatch = trimmed.match(/^\$(contains|startsWith|endsWith)\(([^,]+),\s*(.+)\)$/)
	if (funcMatch) {
		const [, func, path, rawValue] = funcMatch
		let value = rawValue.trim()
		// remove quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		return {
			id: generateId(),
			path: path.trim(),
			operator: func as Operator,
			value,
		}
	}

	// handle comparison operators
	const compMatch = trimmed.match(/^([^\s=!<>]+)\s*(=|!=|<=|>=|<|>|in)\s*(.+)$/)
	if (compMatch) {
		const [, path, op, rawValue] = compMatch
		let value = rawValue.trim()
		// remove quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}
		return {
			id: generateId(),
			path: path.trim(),
			operator: op as Operator,
			value,
		}
	}

	return null
}

export interface UseQueryBuilderOptions {
	value: string
	onChange: (value: string) => void
	defaultMode?: QueryMode
}

export interface UseQueryBuilderReturn {
	mode: QueryMode
	setMode: (mode: QueryMode) => void
	codeValue: string
	setCodeValue: (value: string) => void
	visualQuery: VisualQuery
	setVisualQuery: (query: VisualQuery) => void
	canUseVisualMode: boolean
	addCondition: () => void
	addGroup: () => void
	removeCondition: (id: string) => void
	updateCondition: (id: string, condition: VisualCondition) => void
	updateGroupOperator: (id: string, operator: LogicalOperator) => void
	syncToCode: () => void
	syncToVisual: () => boolean
}

export function useQueryBuilder({
	value,
	onChange,
	defaultMode = "visual",
}: UseQueryBuilderOptions): UseQueryBuilderReturn {
	const [mode, setModeInternal] = useState<QueryMode>(defaultMode)
	const [visualQuery, setVisualQueryInternal] = useState<VisualQuery>(() => {
		const parsed = parseJsonataToQuery(value)
		return parsed ?? createEmptyQuery()
	})
	const [canUseVisualMode, setCanUseVisualMode] = useState(() => {
		return parseJsonataToQuery(value) !== null || !value.trim()
	})

	const setCodeValue = useCallback(
		(newValue: string) => {
			onChange(newValue)
			// check if we can still parse it for visual mode
			const parsed = parseJsonataToQuery(newValue)
			setCanUseVisualMode(parsed !== null || !newValue.trim())
		},
		[onChange]
	)

	const setVisualQuery = useCallback(
		(query: VisualQuery) => {
			setVisualQueryInternal(query)
			const jsonata = queryToJsonata(query)
			onChange(jsonata)
		},
		[onChange]
	)

	const setMode = useCallback(
		(newMode: QueryMode) => {
			if (newMode === "visual" && !canUseVisualMode) {
				return
			}
			if (newMode === "visual" && mode === "code") {
				// try to sync from code to visual
				const parsed = parseJsonataToQuery(value)
				if (parsed) {
					setVisualQueryInternal(parsed)
				}
			}
			setModeInternal(newMode)
		},
		[canUseVisualMode, mode, value]
	)

	const addCondition = useCallback(() => {
		setVisualQuery({
			...visualQuery,
			conditions: [...visualQuery.conditions, createCondition("")],
		})
	}, [visualQuery, setVisualQuery])

	const addGroup = useCallback(() => {
		setVisualQuery({
			...visualQuery,
			conditions: [
				...visualQuery.conditions,
				{
					id: generateId(),
					type: "group",
					operator: "and",
					conditions: [],
				},
			],
		})
	}, [visualQuery, setVisualQuery])

	const removeCondition = useCallback(
		(id: string) => {
			const removeFromGroup = (group: VisualConditionGroup): VisualConditionGroup => {
				return {
					...group,
					conditions: group.conditions
						.filter((c) => c.id !== id)
						.map((c) => {
							if ("type" in c && c.type === "group") {
								return removeFromGroup(c)
							}
							return c
						}),
				}
			}
			setVisualQuery(removeFromGroup(visualQuery))
		},
		[visualQuery, setVisualQuery]
	)

	const updateCondition = useCallback(
		(id: string, condition: VisualCondition) => {
			const updateInGroup = (group: VisualConditionGroup): VisualConditionGroup => {
				return {
					...group,
					conditions: group.conditions.map((c) => {
						if (c.id === id) {
							return condition
						}
						if ("type" in c && c.type === "group") {
							return updateInGroup(c)
						}
						return c
					}),
				}
			}
			setVisualQuery(updateInGroup(visualQuery))
		},
		[visualQuery, setVisualQuery]
	)

	const updateGroupOperator = useCallback(
		(id: string, operator: LogicalOperator) => {
			const updateInGroup = (group: VisualConditionGroup): VisualConditionGroup => {
				if (group.id === id) {
					return { ...group, operator }
				}
				return {
					...group,
					conditions: group.conditions.map((c) => {
						if ("type" in c && c.type === "group") {
							return updateInGroup(c)
						}
						return c
					}),
				}
			}
			setVisualQuery(updateInGroup(visualQuery))
		},
		[visualQuery, setVisualQuery]
	)

	const syncToCode = useCallback(() => {
		const jsonata = queryToJsonata(visualQuery)
		onChange(jsonata)
	}, [visualQuery, onChange])

	const syncToVisual = useCallback((): boolean => {
		const parsed = parseJsonataToQuery(value)
		if (parsed) {
			setVisualQueryInternal(parsed)
			return true
		}
		return false
	}, [value])

	return {
		mode,
		setMode,
		codeValue: value,
		setCodeValue,
		visualQuery,
		setVisualQuery,
		canUseVisualMode,
		addCondition,
		addGroup,
		removeCondition,
		updateCondition,
		updateGroupOperator,
		syncToCode,
		syncToVisual,
	}
}
