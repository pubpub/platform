"use client"

import type { AutomationConditionBlockType, AutomationConditionType } from "db/public"

import type { LogicalOperator, Operator, VisualCondition, VisualConditionGroup, VisualQuery } from "./types"

// form types that match what the ConditionBlock component uses
export type ConditionFormValue = {
	id?: string
	kind: "condition"
	type: AutomationConditionType
	expression: string
	rank: string
}

export type ConditionBlockFormValue = {
	id?: string
	kind: "block"
	type: AutomationConditionBlockType
	rank: string
	items: ConditionItemFormValue[]
}

export type ConditionItemFormValue = ConditionFormValue | ConditionBlockFormValue

function generateId(): string {
	return Math.random().toString(36).substring(2, 9)
}

function generateRank(index: number): string {
	// simple lexicographic ranking
	return String(index).padStart(6, "0")
}

// parse a jsonata expression string into path, operator, value
function parseExpression(expression: string): { path: string; operator: Operator; value: string } | null {
	const trimmed = expression.trim()

	// handle $exists(path)
	const existsMatch = trimmed.match(/^\$exists\(([^)]+)\)$/)
	if (existsMatch) {
		return {
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
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1)
		}
		return {
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
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1)
		}
		return {
			path: path.trim(),
			operator: op as Operator,
			value,
		}
	}

	// couldn't parse - return as custom expression
	return null
}

// convert a visual condition to jsonata expression
function conditionToExpression(condition: VisualCondition): string {
	const { path, operator, value } = condition

	if (!path) {
		return ""
	}

	if (operator === "exists") {
		return `$exists(${path})`
	}

	if (operator === "contains" || operator === "startsWith" || operator === "endsWith") {
		const escapedValue = JSON.stringify(value)
		return `$${operator}(${path}, ${escapedValue})`
	}

	// comparison operators
	const escapedValue = isNaN(Number(value)) ? JSON.stringify(value) : value
	return `${path} ${operator} ${escapedValue}`
}

// translate VisualQuery -> ConditionBlockFormValue
export function visualQueryToConditionBlock(
	query: VisualQuery,
	automationConditionType: AutomationConditionType = "jsonata" as AutomationConditionType
): ConditionBlockFormValue {
	function translateGroup(group: VisualConditionGroup, depth: number = 0): ConditionBlockFormValue {
		const blockType = group.operator === "and" ? "AND" : "OR"

		const items: ConditionItemFormValue[] = group.conditions.map((item, index) => {
			if ("type" in item && item.type === "group") {
				return translateGroup(item as VisualConditionGroup, depth + 1)
			}

			const visualCondition = item as VisualCondition
			return {
				id: visualCondition.id,
				kind: "condition" as const,
				type: automationConditionType,
				expression: conditionToExpression(visualCondition),
				rank: generateRank(index),
			}
		})

		return {
			id: group.id,
			kind: "block" as const,
			type: blockType as AutomationConditionBlockType,
			rank: generateRank(depth),
			items,
		}
	}

	return translateGroup(query)
}

// translate ConditionBlockFormValue -> VisualQuery
export function conditionBlockToVisualQuery(block: ConditionBlockFormValue): VisualQuery {
	function translateBlock(block: ConditionBlockFormValue): VisualConditionGroup {
		const operator: LogicalOperator = block.type === "AND" ? "and" : "or"

		const conditions: (VisualCondition | VisualConditionGroup)[] = block.items.map((item) => {
			if (item.kind === "block") {
				return translateBlock(item)
			}

			// try to parse the expression
			const parsed = parseExpression(item.expression)
			if (parsed) {
				return {
					id: item.id ?? generateId(),
					path: parsed.path,
					operator: parsed.operator,
					value: parsed.value,
				}
			}

			// couldn't parse - store whole expression as path with "exists" operator
			// this preserves complex expressions
			return {
				id: item.id ?? generateId(),
				path: item.expression,
				operator: "=" as Operator,
				value: "true",
			}
		})

		return {
			id: block.id ?? generateId(),
			type: "group",
			operator,
			conditions,
		}
	}

	return translateBlock(block)
}

// create an empty condition block
export function createEmptyConditionBlock(): ConditionBlockFormValue {
	return {
		kind: "block",
		type: "AND" as AutomationConditionBlockType,
		rank: generateRank(0),
		items: [],
	}
}

// create an empty visual query
export function createEmptyVisualQuery(): VisualQuery {
	return {
		id: generateId(),
		type: "group",
		operator: "and",
		conditions: [],
	}
}
