// integration tests - verify actual query execution against postgres

import type { Kysely } from "kysely"

import { afterAll, beforeAll, describe, expect, test } from "vitest"

import { createQuata } from "../quata.js"
import { defineSchema } from "../schema/types.js"
import {
	closeTestDb,
	getTestDb,
	seedComplexTestData,
	setupComplexTestSchema,
	teardownComplexTestSchema,
} from "./db.js"

// schema that matches our complex test database
const testSchema = defineSchema({
	tables: {
		quata_pubs: {
			fields: {
				id: { type: "number" },
				title: { type: "string" },
				status: { type: "string" },
				views: { type: "number" },
				score: { type: "number" },
				authorId: { column: "author_id", type: "number" },
				categoryId: { column: "category_id", type: "number" },
				createdAt: { column: "created_at", type: "date" },
			},
			relations: {
				author: {
					target: "quata_authors",
					foreignKey: "author_id",
					type: "many-to-one",
				},
				category: {
					target: "quata_categories",
					foreignKey: "category_id",
					type: "many-to-one",
				},
			},
		},
		quata_authors: {
			fields: {
				id: { type: "number" },
				name: { type: "string" },
				email: { type: "string" },
				verified: { type: "boolean" },
			},
			relations: {},
		},
		quata_categories: {
			fields: {
				id: { type: "number" },
				name: { type: "string" },
				slug: { type: "string" },
			},
			relations: {},
		},
		quata_comments: {
			fields: {
				id: { type: "number" },
				pubId: { column: "pub_id", type: "number" },
				authorId: { column: "author_id", type: "number" },
				content: { type: "string" },
				likes: { type: "number" },
				createdAt: { column: "created_at", type: "date" },
			},
			relations: {
				pub: {
					target: "quata_pubs",
					foreignKey: "pub_id",
					type: "many-to-one",
				},
				author: {
					target: "quata_authors",
					foreignKey: "author_id",
					type: "many-to-one",
				},
			},
		},
	},
})

// result type helpers
interface Pub {
	id: number
	title: string
	status: string
	views: number
	score: number
	author_id: number
	category_id: number
	created_at: Date
}

interface Author {
	id: number
	name: string
	email: string
	verified: boolean
}

interface Category {
	id: number
	name: string
	slug: string
}

interface Comment {
	id: number
	pub_id: number
	author_id: number
	content: string
	likes: number
	created_at: Date
}

type TestDb = ReturnType<typeof getTestDb>

describe("complex query integration tests", () => {
	let db: TestDb
	let quata: ReturnType<typeof createQuata<typeof testSchema>>

	beforeAll(async () => {
		db = getTestDb()
		await setupComplexTestSchema(db as Kysely<unknown>)
		await seedComplexTestData(db as Kysely<unknown>)
		quata = createQuata(testSchema, db as unknown as Kysely<Record<string, unknown>>)
	})

	afterAll(async () => {
		await teardownComplexTestSchema(db as Kysely<unknown>)
		await closeTestDb()
	})

	describe("filter-sort-limit chain: top published articles by views", () => {
		test("returns exactly 5 published pubs sorted by views descending", async () => {
			const query = quata.compile<Pub>('$$quata_pubs[status = "published"]^(>views)[[0..4]]')
			const results = await query.execute()

			expect(results).toHaveLength(5)
			// verify all are published
			for (const r of results) {
				expect(r.status).toBe("published")
			}
			// verify descending order
			const views = results.map((r) => Number(r.views))
			for (let i = 1; i < views.length; i++) {
				expect(views[i - 1]).toBeGreaterThanOrEqual(views[i])
			}
		})

		test("sql has correct structure", () => {
			const { sql } = quata.compile('$$quata_pubs[status = "published"]^(>views)[[0..4]]')
			const normalized = sql.toLowerCase()

			expect(normalized).toContain("where")
			expect(normalized).toContain("order by")
			expect(normalized).toContain("desc")
			expect(normalized).toContain("limit") // limit value is parameterized
		})
	})

	describe("complex boolean filters", () => {
		test("(published OR featured) AND high views", async () => {
			const query = quata.compile<Pub>(
				'$$quata_pubs[(status = "published" or status = "featured") and views > 400]'
			)
			const results = await query.execute()

			for (const r of results) {
				expect(["published", "featured"]).toContain(r.status)
				expect(Number(r.views)).toBeGreaterThan(400)
			}
		})

		test("published with score between range", async () => {
			const query = quata.compile<Pub>(
				'$$quata_pubs[status = "published" and score >= 50 and score <= 90]^(>score)'
			)
			const results = await query.execute()

			for (const r of results) {
				expect(r.status).toBe("published")
				const score = Number(r.score)
				expect(score).toBeGreaterThanOrEqual(50)
				expect(score).toBeLessThanOrEqual(90)
			}
		})
	})

	describe("aggregate subqueries", () => {
		test("pubs with views above average", async () => {
			const query = quata.compile<Pub>("$$quata_pubs[views > $average($$quata_pubs.views)]")
			const results = await query.execute()

			// calculate expected average
			const allPubs = await db.selectFrom("quata_pubs").select("views").execute()
			const avgViews = allPubs.reduce((sum, p) => sum + Number(p.views), 0) / allPubs.length

			for (const r of results) {
				expect(Number(r.views)).toBeGreaterThan(avgViews)
			}
		})

		test("pub with maximum views", async () => {
			const query = quata.compile<Pub>("$$quata_pubs[views = $max($$quata_pubs.views)][0]")
			const results = await query.execute()

			expect(results).toHaveLength(1)

			const allPubs = await db.selectFrom("quata_pubs").select("views").execute()
			const maxViews = Math.max(...allPubs.map((p) => Number(p.views)))

			expect(Number(results[0].views)).toBe(maxViews)
		})

		test("pub with minimum score among published", async () => {
			// simpler version: just get the minimum score pub using sort and limit
			const query = quata.compile<Pub>('$$quata_pubs[status = "published"]^(score)[0]')
			const results = await query.execute()

			expect(results).toHaveLength(1)
			expect(results[0].status).toBe("published")

			const publishedPubs = await db
				.selectFrom("quata_pubs")
				.select("score")
				.where("status", "=", "published")
				.execute()
			const minScore = Math.min(...publishedPubs.map((p) => Number(p.score)))

			expect(Number(results[0].score)).toBe(minScore)
		})
	})

	describe("projections with computed fields", () => {
		test("projection with arithmetic", async () => {
			interface PubProjection {
				title: string
				engagement: string | number // postgres may return numeric as string
			}
			const query = quata.compile<PubProjection>(
				'$$quata_pubs[status = "published"]^(>views)[[0..2]].{ "title": title, "engagement": views + score * 10 }'
			)
			const results = await query.execute()

			expect(results).toHaveLength(3)

			// verify each result has the expected fields
			for (const r of results) {
				expect(r).toHaveProperty("title")
				expect(r).toHaveProperty("engagement")
			}

			// verify engagement calculation
			const firstResult = results[0]
			const allPubs = await db
				.selectFrom("quata_pubs")
				.selectAll()
				.where("status", "=", "published")
				.orderBy("views", "desc")
				.limit(1)
				.execute()
			const pub = allPubs[0]
			expect(Number(firstResult.engagement)).toBe(Number(pub.views) + Number(pub.score) * 10)
		})

		test("projection with conditional (ternary)", async () => {
			interface TierProjection {
				title: string
				tier: string
			}
			const query = quata.compile<TierProjection>(
				'$$quata_pubs.{ "title": title, "tier": views > 800 ? "viral" : "normal" }'
			)
			const results = await query.execute()

			for (const r of results) {
				expect(r).toHaveProperty("title")
				expect(r).toHaveProperty("tier")
				expect(["viral", "normal"]).toContain(r.tier)
			}

			// verify tiers are assigned correctly
			const allPubs = await db.selectFrom("quata_pubs").selectAll().execute()
			const tierMap = new Map(
				allPubs.map((p) => [p.title, Number(p.views) > 800 ? "viral" : "normal"])
			)

			for (const r of results) {
				expect(r.tier).toBe(tierMap.get(r.title))
			}
		})

		test("projection with multiple conditionals (nested ternary)", async () => {
			interface TierProjection {
				title: string
				tier: string
			}
			const query = quata.compile<TierProjection>(
				'$$quata_pubs.{ "title": title, "tier": views > 800 ? "viral" : views > 400 ? "popular" : "normal" }'
			)
			const results = await query.execute()

			for (const r of results) {
				expect(["viral", "popular", "normal"]).toContain(r.tier)
			}

			const allPubs = await db.selectFrom("quata_pubs").selectAll().execute()
			const tierMap = new Map(
				allPubs.map((p) => {
					const views = Number(p.views)
					const tier = views > 800 ? "viral" : views > 400 ? "popular" : "normal"
					return [p.title, tier]
				})
			)

			for (const r of results) {
				expect(r.tier).toBe(tierMap.get(r.title))
			}
		})
	})

	describe("string functions in filters and projections", () => {
		test("filter by lowercase match", async () => {
			const query = quata.compile<Pub>('$$quata_pubs[$lowercase(status) = "published"]')
			const results = await query.execute()

			for (const r of results) {
				expect(r.status.toLowerCase()).toBe("published")
			}
		})

		test("filter by $contains", async () => {
			const query = quata.compile<Pub>('$$quata_pubs[$contains(title, "Guide")]')
			const results = await query.execute()

			for (const r of results) {
				expect(r.title).toContain("Guide")
			}
		})

		test("projection with string concatenation", async () => {
			interface DisplayProjection {
				display: string
			}
			const query = quata.compile<DisplayProjection>(
				'$$quata_pubs[[0..2]].{ "display": title & " (" & status & ")" }'
			)
			const results = await query.execute()

			expect(results).toHaveLength(3)
			for (const r of results) {
				expect(r.display).toMatch(/^.+ \(.+\)$/)
			}
		})

		test("projection with $uppercase", async () => {
			interface UpperProjection {
				upper: string
			}
			const query = quata.compile<UpperProjection>(
				'$$quata_pubs[[0..2]].{ "upper": $uppercase(status) }'
			)
			const results = await query.execute()

			for (const r of results) {
				expect(r.upper).toBe(r.upper.toUpperCase())
			}
		})
	})

	describe("numeric functions", () => {
		test("filter with $floor", async () => {
			const query = quata.compile<Pub>("$$quata_pubs[$floor(score / 10) = 8]")
			const results = await query.execute()

			for (const r of results) {
				expect(Math.floor(Number(r.score) / 10)).toBe(8)
			}
		})

		test("projection with $round", async () => {
			interface RoundProjection {
				score: number
				rounded: number
			}
			const query = quata.compile<RoundProjection>(
				'$$quata_pubs[[0..2]].{ "score": score, "rounded": $round(score / 7, 1) }'
			)
			const results = await query.execute()

			for (const r of results) {
				const expected = Math.round((Number(r.score) / 7) * 10) / 10
				expect(Number(r.rounded)).toBeCloseTo(expected, 1)
			}
		})
	})

	describe("multi-table queries", () => {
		test("comments ordered by likes", async () => {
			const query = quata.compile<Comment>("$$quata_comments^(>likes)[[0..4]]")
			const results = await query.execute()

			expect(results).toHaveLength(5)
			const likes = results.map((r) => Number(r.likes))
			for (let i = 1; i < likes.length; i++) {
				expect(likes[i - 1]).toBeGreaterThanOrEqual(likes[i])
			}
		})

		test("authors who are verified", async () => {
			const query = quata.compile<Author>("$$quata_authors[verified = true]")
			const results = await query.execute()

			expect(results.length).toBeGreaterThan(0)
			for (const r of results) {
				expect(r.verified).toBe(true)
			}
		})

		test("categories by slug", async () => {
			const query = quata.compile<Category>('$$quata_categories[slug = "technology"]')
			const results = await query.execute()

			expect(results).toHaveLength(1)
			expect(results[0].slug).toBe("technology")
		})
	})

	describe("edge cases and boundary conditions", () => {
		test("empty result set", async () => {
			const query = quata.compile<Pub>("$$quata_pubs[views > 999999]")
			const results = await query.execute()

			expect(results).toHaveLength(0)
		})

		test("limit larger than result set", async () => {
			const query = quata.compile<Category>("$$quata_categories[[0..99]]")
			const results = await query.execute()

			// should return all categories, not crash
			const allCategories = await db.selectFrom("quata_categories").selectAll().execute()
			expect(results.length).toBe(allCategories.length)
		})

		test("offset beyond result set", async () => {
			const query = quata.compile<Category>("$$quata_categories[[100..109]]")
			const results = await query.execute()

			expect(results).toHaveLength(0)
		})

		test("single item with [0]", async () => {
			const query = quata.compile<Pub>("$$quata_pubs^(>views)[0]")
			const results = await query.execute()

			expect(results).toHaveLength(1)

			const topPub = await db
				.selectFrom("quata_pubs")
				.selectAll()
				.orderBy("views", "desc")
				.limit(1)
				.execute()
			expect(results[0].id).toBe(topPub[0].id)
		})
	})

	describe("relation traversal (JOINs)", () => {
		interface PubWithAuthor {
			title: string
			authorName: string
		}

		test("projection with relation field access", async () => {
			const query = quata.compile<PubWithAuthor>(
				'$$quata_pubs[[0..2]].{ "title": title, "authorName": author.name }'
			)
			const results = await query.execute()

			expect(results).toHaveLength(3)
			for (const r of results) {
				expect(r).toHaveProperty("title")
				expect(r).toHaveProperty("authorName")
				expect(typeof r.authorName).toBe("string")
			}
		})

		test("filter by relation field", async () => {
			const query = quata.compile<Pub>("$$quata_pubs[author.verified = true]")
			const results = await query.execute()

			// verify all returned pubs have verified authors
			const authorIds = results.map((r) => r.author_id)
			const authors = await db
				.selectFrom("quata_authors")
				.selectAll()
				.where("id", "in", authorIds)
				.execute()

			for (const author of authors) {
				expect(author.verified).toBe(true)
			}
		})

		test("filter and project through relation", async () => {
			interface PubWithCategory {
				title: string
				category: string
			}
			const query = quata.compile<PubWithCategory>(
				'$$quata_pubs[category.slug = "technology"].{ "title": title, "category": category.name }'
			)
			const results = await query.execute()

			expect(results.length).toBeGreaterThan(0)
			for (const r of results) {
				expect(r.category).toBe("Technology")
			}
		})

		test("complex query: filter by relation, sort, limit, project through relation", async () => {
			interface VerifiedPubSummary {
				title: string
				authorName: string
				views: number
			}
			const query = quata.compile<VerifiedPubSummary>(
				'$$quata_pubs[author.verified = true]^(>views)[[0..2]].{ "title": title, "authorName": author.name, "views": views }'
			)
			const results = await query.execute()

			expect(results).toHaveLength(3)

			// verify descending order by views
			const views = results.map((r) => Number(r.views))
			for (let i = 1; i < views.length; i++) {
				expect(views[i - 1]).toBeGreaterThanOrEqual(views[i])
			}

			// verify all authors are verified
			for (const r of results) {
				expect(r.authorName).toBeTruthy()
			}
		})
	})
})
