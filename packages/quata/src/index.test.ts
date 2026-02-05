// basic tests for the quata library exports

import {
	DummyDriver,
	Kysely,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
} from "kysely"
import { describe, expect, it } from "vitest"

import { createQuata, defineSchema, isValid, SupportTier, validateExpression } from "./index.js"

// create a dummy kysely instance for testing
function createTestDb() {
	return new Kysely<Record<string, unknown>>({
		dialect: {
			createAdapter: () => new PostgresAdapter(),
			createDriver: () => new DummyDriver(),
			createIntrospector: (db) => new PostgresIntrospector(db),
			createQueryCompiler: () => new PostgresQueryCompiler(),
		},
	})
}

describe("quata exports", () => {
	it("exports createQuata", () => {
		expect(createQuata).toBeDefined()
	})

	it("exports defineSchema", () => {
		expect(defineSchema).toBeDefined()
	})

	it("exports validateExpression", () => {
		expect(validateExpression).toBeDefined()
	})

	it("exports isValid", () => {
		expect(isValid).toBeDefined()
	})

	it("exports SupportTier", () => {
		expect(SupportTier).toBeDefined()
		expect(SupportTier.FULL).toBeDefined()
	})
})

describe("schema definition", () => {
	it("creates typed schema", () => {
		const schema = defineSchema({
			tables: {
				items: {
					table: "items",
					fields: {
						id: { column: "id", type: "string" },
						name: { column: "name", type: "string" },
					},
				},
			},
		})

		expect(schema.tables.items.table).toBe("items")
		expect(schema.tables.items.fields.id.column).toBe("id")
	})
})

describe("validation", () => {
	it("validates simple expressions", () => {
		const result = validateExpression("items[price > 100]")
		expect(result.valid).toBe(true)
	})

	it("validates complex expressions", () => {
		const result = validateExpression('items[status = "active"]^(>price).{ "name": name }')
		expect(result.valid).toBe(true)
	})

	it("returns errors for unsupported features", () => {
		const result = validateExpression("items.**")
		expect(result.valid).toBe(false)
		expect(result.errors.length).toBeGreaterThan(0)
	})
})

describe("basic quata usage", () => {
	it("creates a quata instance", () => {
		const db = createTestDb()
		const schema = defineSchema({
			tables: {
				items: {
					table: "items",
					fields: {
						id: { column: "id", type: "string" },
					},
				},
			},
		})

		const quata = createQuata({ schema, db })
		expect(quata).toBeDefined()
		expect(quata.schema).toBe(schema)
	})

	it("compiles a simple query", () => {
		const db = createTestDb()
		const schema = defineSchema({
			tables: {
				items: {
					table: "items",
					fields: {
						id: { column: "id", type: "string" },
						price: { column: "price", type: "number" },
					},
				},
			},
		})

		const quata = createQuata({ schema, db })
		const compiled = quata.compile("items[price > 100]")

		expect(compiled.sql).toBeDefined()
		expect(compiled.sql.toLowerCase()).toContain("select")
		expect(compiled.sql.toLowerCase()).toContain("where")
	})
})
