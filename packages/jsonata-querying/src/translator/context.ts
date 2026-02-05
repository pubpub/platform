// translation context tracks state during ast traversal

import type { Expression, Kysely, RawBuilder } from "kysely"
import type {
	NormalizedQuataSchema,
	NormalizedRelationDefinition,
	NormalizedTableSchema,
} from "../schema/types.js"

// represents a reference that can be used in kysely expressions
export type KyselyRef = Expression<unknown> | RawBuilder<unknown> | string

// binding entry for variable references like $varName
export interface BindingEntry {
	// the kysely expression or reference
	ref: KyselyRef
	// the table alias if this binding represents a table context
	tableAlias?: string
	// the table schema if known
	tableSchema?: NormalizedTableSchema
}

// a pending join that needs to be added to the query
export interface PendingJoin {
	// the relation being joined
	relation: NormalizedRelationDefinition
	// the source table alias
	sourceAlias: string
	// the target table alias
	targetAlias: string
	// the target table name (schema key)
	targetTableName: string
}

export interface TranslationContext {
	// the normalized schema definition
	schema: NormalizedQuataSchema

	// the current table being queried (null if not yet established)
	currentTable: string | null

	// the current table alias (for correlated subqueries)
	currentTableAlias: string | null

	// variable bindings ($varName -> expression)
	bindings: Map<string, BindingEntry>

	// query parameters ($input values)
	parameters: Record<string, unknown>

	// nesting depth for subqueries
	depth: number

	// parent context for correlated subquery references ($this)
	parentContext: TranslationContext | null

	// unique alias counter for generating table aliases
	aliasCounter: number

	// the kysely database instance
	db: Kysely<Record<string, unknown>>

	// joins that need to be applied to the query
	// key is the relation path (e.g., "author" or "author.company")
	pendingJoins: Map<string, PendingJoin>
}

// create a new root translation context
export function createContext(options: {
	schema: NormalizedQuataSchema
	parameters?: Record<string, unknown>
	db: Kysely<Record<string, unknown>>
}): TranslationContext {
	return {
		schema: options.schema,
		currentTable: null,
		currentTableAlias: null,
		bindings: new Map(),
		parameters: options.parameters ?? {},
		depth: 0,
		parentContext: null,
		aliasCounter: 0,
		db: options.db,
		pendingJoins: new Map(),
	}
}

// create a child context for nested queries
export function createChildContext(
	parent: TranslationContext,
	overrides?: Partial<TranslationContext>
): TranslationContext {
	return {
		...parent,
		bindings: new Map(parent.bindings),
		depth: parent.depth + 1,
		parentContext: parent,
		aliasCounter: parent.aliasCounter,
		pendingJoins: new Map(parent.pendingJoins),
		...overrides,
	}
}

// generate a unique table alias
export function generateAlias(ctx: TranslationContext): string {
	const alias = `t${ctx.aliasCounter}`
	ctx.aliasCounter++
	return alias
}

// resolve a table name from the schema
export function resolveTable(
	ctx: TranslationContext,
	tableName: string
): NormalizedTableSchema | null {
	return ctx.schema.tables[tableName] ?? null
}

// resolve a field from the current table
export function resolveField(
	ctx: TranslationContext,
	fieldName: string
): { column: string; tableAlias: string | null } | null {
	if (!ctx.currentTable) {
		return null
	}

	const tableSchema = resolveTable(ctx, ctx.currentTable)
	if (!tableSchema) {
		return null
	}

	const field = tableSchema.fields[fieldName]
	if (!field) {
		return null
	}

	return {
		column: field.column,
		tableAlias: ctx.currentTableAlias,
	}
}

// resolve a variable binding
export function resolveBinding(ctx: TranslationContext, varName: string): BindingEntry | null {
	// check current context first
	const binding = ctx.bindings.get(varName)
	if (binding) {
		return binding
	}

	// check parent contexts
	if (ctx.parentContext) {
		return resolveBinding(ctx.parentContext, varName)
	}

	return null
}

// add a variable binding to the context
export function addBinding(ctx: TranslationContext, varName: string, entry: BindingEntry): void {
	ctx.bindings.set(varName, entry)
}

// resolve a relation from the current table and register a pending join
export function resolveRelation(
	ctx: TranslationContext,
	relationName: string
): { targetTableName: string; targetAlias: string } | null {
	if (!ctx.currentTable || !ctx.currentTableAlias) {
		return null
	}

	const tableSchema = resolveTable(ctx, ctx.currentTable)
	if (!tableSchema) {
		return null
	}

	const relation = tableSchema.relations[relationName]
	if (!relation) {
		return null
	}

	// check if we already have this join
	const joinKey = `${ctx.currentTableAlias}.${relationName}`
	const existingJoin = ctx.pendingJoins.get(joinKey)
	if (existingJoin) {
		return {
			targetTableName: existingJoin.targetTableName,
			targetAlias: existingJoin.targetAlias,
		}
	}

	// create a new join
	const targetAlias = generateAlias(ctx)
	const pendingJoin: PendingJoin = {
		relation,
		sourceAlias: ctx.currentTableAlias,
		targetAlias,
		targetTableName: relation.target,
	}

	ctx.pendingJoins.set(joinKey, pendingJoin)

	return {
		targetTableName: relation.target,
		targetAlias,
	}
}
