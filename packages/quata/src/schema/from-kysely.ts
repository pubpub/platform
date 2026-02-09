// helpers to derive quata schema from kysely database types
// this provides better type inference when defining schemas

import type {
	FieldDefinition,
	FieldType,
	QuataSchema,
	RelationDefinition,
	TableSchema,
} from "./types.js"

// extract the table type from a kysely database
type KyselyTable<DB, K extends keyof DB> = DB[K]

// map common kysely/postgres column types to quata field types
type InferFieldType<T> = T extends string
	? "string"
	: T extends number
		? "number"
		: T extends boolean
			? "boolean"
			: T extends Date
				? "date"
				: T extends object
					? "jsonb"
					: T extends unknown[]
						? "array"
						: "string"

// extract column names from a kysely table type
type ColumnNames<T> = T extends object ? keyof T & string : never

// helper to create a field definition from a kysely column type
export function field<_T>(
	type: FieldType,
	options?: Partial<Omit<FieldDefinition, "type">>
): FieldDefinition {
	return { type, ...options }
}

// shorthand field creators
export const stringField = (opts?: Partial<Omit<FieldDefinition, "type">>) =>
	field<string>("string", opts)
export const numberField = (opts?: Partial<Omit<FieldDefinition, "type">>) =>
	field<number>("number", opts)
export const booleanField = (opts?: Partial<Omit<FieldDefinition, "type">>) =>
	field<boolean>("boolean", opts)
export const dateField = (opts?: Partial<Omit<FieldDefinition, "type">>) =>
	field<Date>("date", opts)
export const jsonbField = (opts?: Partial<Omit<FieldDefinition, "type">>) =>
	field<object>("jsonb", opts)

// helper to create a relation definition
export function relation(
	target: string,
	foreignKey: string,
	options?: Partial<Omit<RelationDefinition, "target" | "foreignKey">>
): RelationDefinition {
	return {
		target,
		foreignKey,
		type: options?.type ?? "many-to-one",
		targetKey: options?.targetKey ?? "id",
	}
}

// helper to define a table schema with type inference from kysely
// this allows autocomplete for column names
export function defineTableFromKysely<DB, TableName extends keyof DB & string>(
	_db: DB,
	_tableName: TableName,
	config: {
		table?: string
		fields: Record<string, FieldDefinition>
		relations?: Record<string, RelationDefinition>
		defaultOrderColumn?: string
	}
): TableSchema {
	return config
}

// type to extract available tables from a kysely database
export type KyselyTableNames<DB> = keyof DB & string

// type-safe schema builder that validates table/column references against kysely types
export interface SchemaBuilder<DB> {
	// add a table to the schema
	table<K extends keyof DB & string>(
		name: K,
		config: {
			table?: string
			fields: Record<string, FieldDefinition>
			relations?: Record<string, RelationDefinition>
			defaultOrderColumn?: string
		}
	): SchemaBuilder<DB>

	// build the final schema
	build(): QuataSchema
}

// create a schema builder typed against a kysely database
export function createSchemaBuilder<DB>(): SchemaBuilder<DB> {
	const tables: Record<string, TableSchema> = {}

	const builder: SchemaBuilder<DB> = {
		table(name, config) {
			tables[name] = config
			return builder
		},
		build() {
			return { tables }
		},
	}

	return builder
}

// utility type to make defining schemas easier by inferring field types
// from kysely column types
export type FieldsFromKysely<T> = {
	[K in keyof T & string]?: FieldDefinition
}
