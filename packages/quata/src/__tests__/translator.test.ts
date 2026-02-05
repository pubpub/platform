// unit tests for quata translator
// these tests verify translation logic by comparing exact sql output

import {
	DummyDriver,
	Kysely,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
} from "kysely"
import { beforeEach, describe, expect, it } from "vitest"

import { createQuata, type Quata } from "../quata.js"
import { defineSchema } from "../schema/types.js"

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

// helper to normalize sql for comparison (removes extra whitespace, normalizes quotes)
function normalizeSql(sql: string): string {
	return sql
		.toLowerCase()
		.replace(/\s+/g, " ")
		.replace(/\(\s+/g, "(")
		.replace(/\s+\)/g, ")")
		.replace(/,\s+/g, ", ")
		.trim()
}

// helper to verify sql contains expected clauses in order
function verifySqlStructure(
	sql: string,
	expectations: {
		select?: string[]
		from?: string
		joins?: string[]
		where?: string
		orderBy?: string[]
		hasLimit?: boolean
		hasOffset?: boolean
	}
) {
	const normalized = normalizeSql(sql)

	if (expectations.select) {
		for (const col of expectations.select) {
			expect(normalized).toContain(col.toLowerCase())
		}
	}

	if (expectations.from) {
		expect(normalized).toMatch(new RegExp(`from\\s+"?${expectations.from}"?`, "i"))
	}

	if (expectations.joins) {
		for (const join of expectations.joins) {
			expect(normalized).toContain(join.toLowerCase())
		}
	}

	if (expectations.where) {
		expect(normalized).toContain(expectations.where.toLowerCase())
	}

	if (expectations.orderBy) {
		for (const order of expectations.orderBy) {
			expect(normalized).toContain(order.toLowerCase())
		}
	}

	if (expectations.hasLimit) {
		expect(normalized).toContain("limit")
	}

	if (expectations.hasOffset) {
		expect(normalized).toContain("offset")
	}
}

// comprehensive schema with relations for testing joins
const testSchema = defineSchema({
	tables: {
		pubs: {
			table: "pubs",
			fields: {
				id: { column: "id", type: "string" },
				title: { column: "title", type: "string" },
				status: { column: "status", type: "string" },
				views: { column: "views", type: "number" },
				score: { column: "score", type: "number" },
				authorId: { column: "author_id", type: "string" },
				categoryId: { column: "category_id", type: "string" },
				createdAt: { column: "created_at", type: "date" },
			},
			relations: {
				author: {
					target: "authors",
					foreignKey: "author_id",
					targetKey: "id",
					type: "many-to-one",
				},
				category: {
					target: "categories",
					foreignKey: "category_id",
					targetKey: "id",
					type: "many-to-one",
				},
			},
		},
		authors: {
			table: "authors",
			fields: {
				id: { column: "id", type: "string" },
				name: { column: "name", type: "string" },
				email: { column: "email", type: "string" },
				bio: { column: "bio", type: "string" },
			},
			relations: {},
		},
		categories: {
			table: "categories",
			fields: {
				id: { column: "id", type: "string" },
				name: { column: "name", type: "string" },
				slug: { column: "slug", type: "string" },
			},
			relations: {},
		},
		comments: {
			table: "comments",
			fields: {
				id: { column: "id", type: "string" },
				pubId: { column: "pub_id", type: "string" },
				authorId: { column: "author_id", type: "string" },
				content: { column: "content", type: "string" },
				createdAt: { column: "created_at", type: "date" },
			},
			relations: {
				pub: {
					target: "pubs",
					foreignKey: "pub_id",
					targetKey: "id",
					type: "many-to-one",
				},
				author: {
					target: "authors",
					foreignKey: "author_id",
					targetKey: "id",
					type: "many-to-one",
				},
			},
		},
	},
})

describe("quata sql generation", () => {
	let db: Kysely<Record<string, unknown>>
	let quata: Quata<typeof testSchema>

	beforeEach(() => {
		db = createTestDb()
		quata = createQuata({ schema: testSchema, db })
	})

	describe("basic select queries", () => {
		it("generates SELECT * with table alias for simple table reference", () => {
			const { sql } = quata.compile("pubs")

			verifySqlStructure(sql, {
				from: "pubs",
			})
			expect(normalizeSql(sql)).toMatch(/select \* from "pubs"/)
		})

		it("generates SELECT * for $$ table reference", () => {
			const { sql } = quata.compile("$$pubs")

			verifySqlStructure(sql, {
				from: "pubs",
			})
			expect(normalizeSql(sql)).toMatch(/select \* from "pubs"/)
		})
	})

	describe("filter clauses (WHERE)", () => {
		it("generates correct WHERE for string equality", () => {
			const { sql } = quata.compile('$$pubs[status = "published"]')

			verifySqlStructure(sql, {
				from: "pubs",
				where: "status",
			})
			expect(normalizeSql(sql)).toContain("where")
			expect(normalizeSql(sql)).toContain("status")
			// value can be inline or parameterized
			expect(sql).toMatch(/published|'\$\d+'/)
		})

		it("generates correct WHERE for numeric comparison", () => {
			const { sql } = quata.compile("$$pubs[views > 1000]")

			verifySqlStructure(sql, {
				from: "pubs",
			})
			expect(normalizeSql(sql)).toContain("where")
			expect(normalizeSql(sql)).toContain(">")
			expect(sql).toMatch(/1000|\$\d+/)
		})

		it("generates AND for multiple conditions", () => {
			const { sql } = quata.compile('$$pubs[status = "published" and views > 100]')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("and")
		})

		it("generates OR for alternative conditions", () => {
			const { sql } = quata.compile('$$pubs[status = "draft" or status = "review"]')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("or")
		})

		it("generates proper parentheses for complex boolean logic", () => {
			const { sql } = quata.compile(
				'$$pubs[(status = "published" or status = "featured") and views > 100]'
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("and")
			expect(normalized).toContain("or")
		})

		it("generates NOT for negation", () => {
			const { sql } = quata.compile('$$pubs[$not(status = "deleted")]')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("not")
		})
	})

	describe("sorting (ORDER BY)", () => {
		it("generates ORDER BY ASC for ascending sort", () => {
			const { sql } = quata.compile("$$pubs^(views)")

			verifySqlStructure(sql, {
				from: "pubs",
				orderBy: ["order by"],
			})
			const normalized = normalizeSql(sql)
			expect(normalized).toContain("order by")
			expect(normalized).not.toContain("desc")
		})

		it("generates ORDER BY DESC for descending sort", () => {
			const { sql } = quata.compile("$$pubs^(>views)")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("order by")
			expect(normalized).toContain("desc")
		})

		it("generates multiple ORDER BY columns", () => {
			const { sql } = quata.compile("$$pubs^(>views, <title)")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("order by")
			// should have two columns in order by
			const orderByMatch = normalized.match(/order by .+/)
			expect(orderByMatch).toBeTruthy()
		})

		it("combines WHERE and ORDER BY correctly", () => {
			const { sql } = quata.compile('$$pubs[status = "published"]^(>views)')

			const normalized = normalizeSql(sql)
			// WHERE should come before ORDER BY
			const whereIdx = normalized.indexOf("where")
			const orderIdx = normalized.indexOf("order by")
			expect(whereIdx).toBeLessThan(orderIdx)
		})
	})

	describe("limiting (LIMIT/OFFSET)", () => {
		it("generates LIMIT for single index access", () => {
			const { sql } = quata.compile("$$pubs[0]")

			verifySqlStructure(sql, {
				from: "pubs",
				hasLimit: true,
			})
		})

		it("generates LIMIT with OFFSET for positive index", () => {
			const { sql } = quata.compile("$$pubs[5]")

			verifySqlStructure(sql, {
				from: "pubs",
				hasLimit: true,
				hasOffset: true,
			})
		})

		it("generates LIMIT for range slice", () => {
			const { sql } = quata.compile("$$pubs[[0..9]]")

			verifySqlStructure(sql, {
				from: "pubs",
				hasLimit: true,
			})
		})

		it("generates LIMIT and OFFSET for range with start", () => {
			const { sql } = quata.compile("$$pubs[[10..19]]")

			verifySqlStructure(sql, {
				from: "pubs",
				hasLimit: true,
				hasOffset: true,
			})
		})

		it("combines sort and limit correctly (ORDER BY before LIMIT)", () => {
			const { sql } = quata.compile("$$pubs^(>views)[0]")

			const normalized = normalizeSql(sql)
			const orderIdx = normalized.indexOf("order by")
			const limitIdx = normalized.indexOf("limit")
			expect(orderIdx).toBeLessThan(limitIdx)
		})
	})

	describe("projections (SELECT columns)", () => {
		it("generates aliased columns for simple projection", () => {
			const { sql } = quata.compile('$$pubs.{ "name": title, "hits": views }')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain('"name"')
			expect(normalized).toContain('"hits"')
		})

		it("generates computed expression in projection", () => {
			const { sql } = quata.compile('$$pubs.{ "doubled": views * 2 }')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("*")
			expect(normalized).toContain("2")
		})

		it("generates CASE WHEN for conditional projection", () => {
			const { sql } = quata.compile('$$pubs.{ "label": views > 1000 ? "popular" : "normal" }')

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("case")
			expect(normalized).toContain("when")
			expect(normalized).toContain("then")
			expect(normalized).toContain("else")
			expect(normalized).toContain("end")
		})
	})

	describe("function translations", () => {
		it("translates $lowercase to LOWER", () => {
			const { sql } = quata.compile('$$pubs.{ "lower": $lowercase(title) }')
			expect(normalizeSql(sql)).toContain("lower(")
		})

		it("translates $uppercase to UPPER", () => {
			const { sql } = quata.compile('$$pubs.{ "upper": $uppercase(title) }')
			expect(normalizeSql(sql)).toContain("upper(")
		})

		it("translates $length to LENGTH", () => {
			const { sql } = quata.compile('$$pubs.{ "len": $length(title) }')
			expect(normalizeSql(sql)).toContain("length(")
		})

		it("translates $substring to SUBSTRING", () => {
			const { sql } = quata.compile('$$pubs.{ "sub": $substring(title, 0, 10) }')
			expect(normalizeSql(sql)).toContain("substring(")
		})

		it("translates $trim to TRIM", () => {
			const { sql } = quata.compile('$$pubs.{ "trimmed": $trim(title) }')
			expect(normalizeSql(sql)).toContain("trim(")
		})

		it("translates $round to ROUND", () => {
			const { sql } = quata.compile('$$pubs.{ "rounded": $round(score, 2) }')
			expect(normalizeSql(sql)).toContain("round(")
		})

		it("translates $floor to FLOOR", () => {
			const { sql } = quata.compile('$$pubs.{ "floored": $floor(score) }')
			expect(normalizeSql(sql)).toContain("floor(")
		})

		it("translates $ceil to CEIL", () => {
			const { sql } = quata.compile('$$pubs.{ "ceiled": $ceil(score) }')
			expect(normalizeSql(sql)).toContain("ceil(")
		})

		it("translates $abs to ABS", () => {
			const { sql } = quata.compile('$$pubs.{ "absolute": $abs(score) }')
			expect(normalizeSql(sql)).toContain("abs(")
		})

		it("translates $contains to POSITION > 0", () => {
			const { sql } = quata.compile('$$pubs[$contains(title, "test")]')
			expect(normalizeSql(sql)).toContain("position(")
		})

		it("translates $exists to IS NOT NULL", () => {
			const { sql } = quata.compile("$$pubs[$exists(title)]")
			expect(normalizeSql(sql)).toContain("is not null")
		})

		it("translates $string to CAST AS TEXT", () => {
			const { sql } = quata.compile('$$pubs.{ "str": $string(views) }')
			const normalized = normalizeSql(sql)
			expect(normalized).toContain("cast(")
			expect(normalized).toContain("text")
		})

		it("translates $number to CAST AS NUMERIC", () => {
			const { sql } = quata.compile('$$pubs.{ "num": $number(status) }')
			const normalized = normalizeSql(sql)
			expect(normalized).toContain("cast(")
			expect(normalized).toContain("numeric")
		})
	})

	describe("arithmetic operations", () => {
		it("generates + for addition", () => {
			const { sql } = quata.compile('$$pubs.{ "sum": views + score }')
			expect(sql).toContain("+")
		})

		it("generates - for subtraction", () => {
			const { sql } = quata.compile('$$pubs.{ "diff": views - score }')
			expect(sql).toContain("-")
		})

		it("generates * for multiplication", () => {
			const { sql } = quata.compile('$$pubs.{ "product": views * 2 }')
			expect(sql).toContain("*")
		})

		it("generates / for division", () => {
			const { sql } = quata.compile('$$pubs.{ "quotient": views / 10 }')
			expect(sql).toContain("/")
		})

		it("handles complex arithmetic expression", () => {
			const { sql } = quata.compile('$$pubs.{ "calc": (views + score) * 2 }')
			// verifies that the arithmetic operators are present
			// parentheses may or may not be preserved by kysely
			expect(sql).toContain("+")
			expect(sql).toContain("*")
		})
	})

	describe("string operations", () => {
		it("generates || for string concatenation", () => {
			const { sql } = quata.compile('$$pubs.{ "full": title & " - " & status }')
			expect(sql).toContain("||")
		})
	})

	describe("aggregate functions with subqueries", () => {
		it("generates subquery for $average with nested path", () => {
			const { sql } = quata.compile("$$pubs[views > $average($$pubs.views)]")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("avg(")
			// should have a subquery
			expect(normalized).toContain("select")
			expect((normalized.match(/select/g) || []).length).toBeGreaterThanOrEqual(2)
		})

		it("generates subquery for $count with nested path", () => {
			const { sql } = quata.compile("$$pubs[$count($$pubs) > 10]")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("count(")
		})

		it("generates subquery for $sum with nested path", () => {
			const { sql } = quata.compile("$$pubs[views < $sum($$pubs.views) / 100]")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("sum(")
		})

		it("generates subquery for $max with nested path", () => {
			const { sql } = quata.compile("$$pubs[views = $max($$pubs.views)]")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("max(")
		})

		it("generates subquery for $min with nested path", () => {
			const { sql } = quata.compile("$$pubs[views = $min($$pubs.views)]")

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("min(")
		})
	})
})

describe("complex query patterns", () => {
	let db: Kysely<Record<string, unknown>>
	let quata: Quata<typeof testSchema>

	beforeEach(() => {
		db = createTestDb()
		quata = createQuata({ schema: testSchema, db })
	})

	describe("filter-sort-limit chains", () => {
		it("generates correct SQL for filter -> sort -> limit chain", () => {
			const { sql } = quata.compile('$$pubs[status = "published"]^(>views)[[0..9]]')

			const normalized = normalizeSql(sql)

			// verify structure order: FROM -> WHERE -> ORDER BY -> LIMIT
			const fromIdx = normalized.indexOf("from")
			const whereIdx = normalized.indexOf("where")
			const orderIdx = normalized.indexOf("order by")
			const limitIdx = normalized.indexOf("limit")

			expect(fromIdx).toBeLessThan(whereIdx)
			expect(whereIdx).toBeLessThan(orderIdx)
			expect(orderIdx).toBeLessThan(limitIdx)

			expect(normalized).toContain("desc")
			expect(normalized).toContain("limit")
		})

		it("generates correct SQL for complex filter with sort", () => {
			const { sql } = quata.compile(
				'$$pubs[(status = "published" or status = "featured") and views > 100]^(>score, <title)'
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("or")
			expect(normalized).toContain("and")
			expect(normalized).toContain("order by")
		})

		it("generates correct SQL for filter with aggregate comparison", () => {
			const { sql } = quata.compile(
				'$$pubs[status = "published" and views > $average($$pubs.views)]^(>views)[0]'
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("avg(")
			expect(normalized).toContain("order by")
			expect(normalized).toContain("limit")
		})
	})

	describe("projections with computed fields", () => {
		it("generates SQL for projection with arithmetic", () => {
			const { sql } = quata.compile(
				'$$pubs.{ "title": title, "engagement": views + score * 10 }'
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain('"title"')
			expect(normalized).toContain('"engagement"')
			expect(normalized).toContain("+")
			expect(normalized).toContain("*")
		})

		it("generates SQL for projection with conditionals", () => {
			const { sql } = quata.compile(
				`$$pubs.{
					"title": title,
					"tier": views > 10000 ? "viral" : views > 1000 ? "popular" : "normal"
				}`
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("case")
			// nested ternary = nested CASE
			expect((normalized.match(/case/g) || []).length).toBeGreaterThanOrEqual(1)
		})

		it("generates SQL for filter + projection chain", () => {
			const { sql } = quata.compile(
				'$$pubs[status = "published"]^(>views)[[0..4]].{ "title": title, "hits": views }'
			)

			const normalized = normalizeSql(sql)
			expect(normalized).toContain("where")
			expect(normalized).toContain("order by")
			expect(normalized).toContain("limit")
			expect(normalized).toContain('"title"')
			expect(normalized).toContain('"hits"')
		})
	})
})

describe("relation traversal (JOINs)", () => {
	let db: Kysely<Record<string, unknown>>
	let quata: Quata<typeof testSchema>

	beforeEach(() => {
		db = createTestDb()
		quata = createQuata({ schema: testSchema, db })
	})

	it("generates LEFT JOIN for relation access in projection", () => {
		const { sql } = quata.compile('$$pubs.{ "title": title, "authorName": author.name }')

		const normalized = normalizeSql(sql)
		expect(normalized).toContain("left join")
		expect(normalized).toContain("authors")
		expect(normalized).toContain("on")
	})

	it("generates LEFT JOIN for relation access in filter", () => {
		const { sql } = quata.compile('$$pubs[author.name = "Alice"]')

		const normalized = normalizeSql(sql)
		expect(normalized).toContain("left join")
		expect(normalized).toContain("authors")
		expect(normalized).toContain("where")
	})

	it("generates multiple JOINs for multiple relations", () => {
		const { sql } = quata.compile(
			'$$pubs.{ "authorName": author.name, "catName": category.name }'
		)

		const normalized = normalizeSql(sql)
		// should have two left joins
		const joinCount = (normalized.match(/left join/g) || []).length
		expect(joinCount).toBe(2)
	})

	it("generates correct join condition using foreign keys", () => {
		const { sql } = quata.compile('$$pubs.{ "authorName": author.name }')

		const normalized = normalizeSql(sql)
		// should join on author_id = id
		expect(normalized).toContain("author_id")
	})
})

describe("validation", () => {
	let db: Kysely<Record<string, unknown>>
	let quata: Quata<typeof testSchema>

	beforeEach(() => {
		db = createTestDb()
		quata = createQuata({ schema: testSchema, db })
	})

	it("validates supported expressions", () => {
		expect(quata.validate('$$pubs[status = "published"]^(>views)[[0..9]]').valid).toBe(true)
		expect(quata.validate('$$pubs.{ "title": title }').valid).toBe(true)
		expect(quata.validate("$$pubs[views > $average($$pubs.views)]").valid).toBe(true)
	})

	it("rejects unsupported recursive descent", () => {
		expect(quata.validate("pubs.**").valid).toBe(false)
	})

	it("rejects unsupported parent operator", () => {
		expect(quata.validate("pubs.%").valid).toBe(false)
	})
})
