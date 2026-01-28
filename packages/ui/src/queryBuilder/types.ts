"use client"

import type { PubTypes, Stages } from "db/public"

import type { PubField } from "../pubFields/PubFieldContext"

export type QueryContext = "pub" | "json" | "both"

export type QueryMode = "visual" | "code"

export const COMPARISON_OPERATORS = [
	{ value: "=", label: "equals" },
	{ value: "!=", label: "not equals" },
	{ value: ">", label: "greater than" },
	{ value: ">=", label: "greater or equal" },
	{ value: "<", label: "less than" },
	{ value: "<=", label: "less or equal" },
	{ value: "in", label: "in" },
] as const

export const STRING_FUNCTIONS = [
	{ value: "contains", label: "contains" },
	{ value: "startsWith", label: "starts with" },
	{ value: "endsWith", label: "ends with" },
] as const

export const BOOLEAN_FUNCTIONS = [{ value: "exists", label: "exists" }] as const

export type ComparisonOperator = (typeof COMPARISON_OPERATORS)[number]["value"]
export type StringFunction = (typeof STRING_FUNCTIONS)[number]["value"]
export type BooleanFunction = (typeof BOOLEAN_FUNCTIONS)[number]["value"]
export type Operator = ComparisonOperator | StringFunction | BooleanFunction

export type LogicalOperator = "and" | "or"

export type VisualCondition = {
	id: string
	path: string
	operator: Operator
	value: string
}

export type VisualConditionGroup = {
	id: string
	type: "group"
	operator: LogicalOperator
	conditions: (VisualCondition | VisualConditionGroup)[]
}

export type VisualQuery = VisualConditionGroup

// builtin fields available for pub context
export const BUILTIN_PUB_FIELDS = [
	{ path: "$.pub.id", label: "ID", type: "string" },
	{ path: "$.pub.title", label: "Title", type: "string" },
	{ path: "$.pub.createdAt", label: "Created At", type: "date" },
	{ path: "$.pub.updatedAt", label: "Updated At", type: "date" },
	{ path: "$.pub.pubTypeId", label: "Pub Type ID", type: "string" },
	{ path: "$.pub.stageId", label: "Stage ID", type: "string" },
	{ path: "$.pub.pubType.name", label: "Pub Type Name", type: "string" },
] as const

export interface FieldOption {
	path: string
	label: string
	type?: string
}

export interface QueryBuilderProps {
	value: string
	onChange: (value: string) => void
	context?: QueryContext
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	defaultMode?: QueryMode
	theme?: "light" | "dark"
	className?: string
	placeholder?: string
	disabled?: boolean
	// when true, allows free-form json paths even without schema
	allowFreeformJsonPaths?: boolean
}

export interface VisualFilterBuilderProps {
	query: VisualQuery
	onChange: (query: VisualQuery) => void
	pubFields?: Record<string, PubField>
	pubTypes?: PubTypes[]
	stages?: Stages[]
	disabled?: boolean
}
