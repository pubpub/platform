// schema definition types for quata
// consumers define their data model using these interfaces

export type FieldType = "string" | "number" | "boolean" | "date" | "jsonb" | "array"

// simplified field definition - just type and optionally nullable
// column name defaults to the field key
export interface FieldDefinition {
	// the actual sql column name (defaults to the field key)
	column?: string
	type: FieldType
	// for nested jsonb access, eg data.nested.field -> data->'nested'->>'field'
	jsonbPath?: string[]
	// whether this field is nullable
	nullable?: boolean
}

// normalized internal representation with required column
export interface NormalizedFieldDefinition {
	column: string
	type: FieldType
	jsonbPath?: string[]
	nullable?: boolean
}

export type RelationType = "one-to-one" | "one-to-many" | "many-to-one"

export interface RelationDefinition {
	// the target table name (as defined in QuataSchema.tables)
	target: string
	// the foreign key column on the source table
	foreignKey: string
	// the target key column on the target table (defaults to 'id')
	targetKey?: string
	// the type of relation determines how joins/subqueries are generated
	type: RelationType
}

// normalized internal representation
export interface NormalizedRelationDefinition {
	target: string
	foreignKey: string
	targetKey: string
	type: RelationType
}

export interface TableSchema<TFields extends string = string> {
	// the actual sql table name (defaults to the table key)
	table?: string
	// field definitions mapping jsonata field names to sql columns
	fields: Record<TFields, FieldDefinition>
	// optional relation definitions for joins
	relations?: Record<string, RelationDefinition>
	// optional default ordering column for negative indexing
	defaultOrderColumn?: string
}

// normalized table schema
export interface NormalizedTableSchema {
	table: string
	fields: Record<string, NormalizedFieldDefinition>
	relations: Record<string, NormalizedRelationDefinition>
	defaultOrderColumn?: string
}

export interface QuataSchema<TTables extends string = string> {
	// table definitions mapping jsonata table references to sql tables
	tables: Record<TTables, TableSchema>
}

// normalized schema
export interface NormalizedQuataSchema {
	tables: Record<string, NormalizedTableSchema>
}

// helper type to extract table names from a schema
export type TableNames<T extends QuataSchema> = keyof T["tables"] & string

// helper type to extract field names from a table
export type FieldNames<
	T extends QuataSchema,
	TTable extends TableNames<T>,
> = keyof T["tables"][TTable]["fields"] & string

// helper to create a typed schema
export function defineSchema<const T extends QuataSchema>(schema: T): T {
	return schema
}

// helper to create a typed table schema
export function defineTable<const T extends TableSchema>(table: T): T {
	return table
}

// normalize a field definition by applying defaults
function normalizeField(fieldKey: string, field: FieldDefinition): NormalizedFieldDefinition {
	return {
		column: field.column ?? fieldKey,
		type: field.type,
		jsonbPath: field.jsonbPath,
		nullable: field.nullable,
	}
}

// normalize a relation definition by applying defaults
function normalizeRelation(relation: RelationDefinition): NormalizedRelationDefinition {
	return {
		target: relation.target,
		foreignKey: relation.foreignKey,
		targetKey: relation.targetKey ?? "id",
		type: relation.type,
	}
}

// normalize a table schema by applying defaults
function normalizeTable(tableKey: string, table: TableSchema): NormalizedTableSchema {
	const fields: Record<string, NormalizedFieldDefinition> = {}
	for (const [fieldKey, field] of Object.entries(table.fields)) {
		fields[fieldKey] = normalizeField(fieldKey, field)
	}

	const relations: Record<string, NormalizedRelationDefinition> = {}
	if (table.relations) {
		for (const [relKey, rel] of Object.entries(table.relations)) {
			relations[relKey] = normalizeRelation(rel)
		}
	}

	return {
		table: table.table ?? tableKey,
		fields,
		relations,
		defaultOrderColumn: table.defaultOrderColumn,
	}
}

// normalize a full schema by applying defaults
export function normalizeSchema(schema: QuataSchema): NormalizedQuataSchema {
	const tables: Record<string, NormalizedTableSchema> = {}
	for (const [tableKey, table] of Object.entries(schema.tables)) {
		tables[tableKey] = normalizeTable(tableKey, table)
	}
	return { tables }
}
