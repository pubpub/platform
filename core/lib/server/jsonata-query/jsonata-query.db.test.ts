import type { ProcessedPub } from "contracts"
import type { CommunitiesId, PubsId } from "db/public"

import { describe, expect, it } from "vitest"

import { CoreSchemaType } from "db/public"

import { createSeed } from "~/prisma/seed/createSeed"
import { mockServerCode } from "../../__tests__/utils"
import {
	compileJsonataQuery,
	filterPubsWithJsonata,
	parseJsonataQuery,
	pubMatchesJsonataQuery,
} from "./index"
import { applyJsonataFilter } from "./sql-builder"

const { createForEachMockedTransaction, testDb } = await mockServerCode()
const { getTrx } = createForEachMockedTransaction()

const communitySlug = `${new Date().toISOString()}:jsonata-query-test`

// test pub ids
const titlePubId = crypto.randomUUID() as PubsId
const title2PubId = crypto.randomUUID() as PubsId
const numberPubId = crypto.randomUUID() as PubsId
const number42PubId = crypto.randomUUID() as PubsId
const booleanPubId = crypto.randomUUID() as PubsId
const arrayPubId = crypto.randomUUID() as PubsId
const complexPubId = crypto.randomUUID() as PubsId
// relation test pub ids
const author1Id = crypto.randomUUID() as PubsId
const author2Id = crypto.randomUUID() as PubsId
const author3Id = crypto.randomUUID() as PubsId
const bookPubId = crypto.randomUUID() as PubsId
const chapter1PubId = crypto.randomUUID() as PubsId
const chapter2PubId = crypto.randomUUID() as PubsId

const seed = createSeed({
	community: {
		name: "jsonata query test",
		slug: communitySlug,
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Number: { schemaName: CoreSchemaType.Number },
		Boolean: { schemaName: CoreSchemaType.Boolean },
		Date: { schemaName: CoreSchemaType.DateTime },
		Array: { schemaName: CoreSchemaType.StringArray },
		Institution: { schemaName: CoreSchemaType.String },
		Contributors: { schemaName: CoreSchemaType.String, relation: true },
		Chapters: { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		Article: {
			Title: { isTitle: true },
			Number: { isTitle: false },
			Boolean: { isTitle: false },
			Date: { isTitle: false },
			Array: { isTitle: false },
			Contributors: { isTitle: false },
		},
		Author: {
			Title: { isTitle: true },
			Institution: { isTitle: false },
		},
		Book: {
			Title: { isTitle: true },
			Chapters: { isTitle: false },
		},
		Chapter: {
			Title: { isTitle: true },
			Number: { isTitle: false },
		},
		Review: {
			Title: { isTitle: true },
			Number: { isTitle: false },
		},
	},
	stages: {},
	pubs: [
		// first create authors (referenced later)
		{
			id: author1Id,
			pubType: "Author",
			values: {
				Title: "John Smith",
				Institution: "University of Groningen",
			},
		},
		{
			id: author2Id,
			pubType: "Author",
			values: {
				Title: "Jane Doe",
				Institution: "MIT",
			},
		},
		{
			id: author3Id,
			pubType: "Author",
			values: {
				Title: "Bob Wilson",
				Institution: "University of Groningen",
			},
		},
		// articles with contributors
		{
			id: titlePubId,
			pubType: "Article",
			values: {
				Title: "Test Article",
				Number: 100,
				Boolean: true,
				Contributors: [
					{ value: "Primary Author", relatedPubId: author1Id },
					{ value: "Editor", relatedPubId: author2Id },
				],
			},
		},
		{
			id: title2PubId,
			pubType: "Article",
			values: {
				Title: "Another Article",
				Number: 50,
				Boolean: false,
				Contributors: [{ value: "Primary Author", relatedPubId: author3Id }],
			},
		},
		{
			id: numberPubId,
			pubType: "Review",
			values: {
				Title: "Some Review",
				Number: 25,
			},
		},
		{
			id: number42PubId,
			pubType: "Article",
			values: {
				Title: "The Answer",
				Number: 42,
				Boolean: true,
			},
		},
		{
			id: booleanPubId,
			pubType: "Article",
			values: {
				Title: "Boolean Test",
				Boolean: false,
			},
		},
		{
			id: arrayPubId,
			pubType: "Article",
			values: {
				Title: "Array Test",
				Array: ["geology", "biology", "chemistry"],
			},
		},
		// chapters for the book (created first so book can reference them)
		{
			id: chapter1PubId,
			pubType: "Chapter",
			values: {
				Title: "Chapter One",
				Number: 1,
			},
		},
		{
			id: chapter2PubId,
			pubType: "Chapter",
			values: {
				Title: "Chapter Two",
				Number: 2,
			},
		},
		// book with chapters
		{
			id: bookPubId,
			pubType: "Book",
			values: {
				Title: "The Big Book",
				Chapters: [
					{ value: "Introduction", relatedPubId: chapter1PubId },
					{ value: "Main Content", relatedPubId: chapter2PubId },
				],
			},
		},
		{
			id: complexPubId,
			pubType: "Article",
			values: {
				Title: "Important Document",
				Number: 75,
				Boolean: true,
				Array: ["important", "featured"],
			},
		},
	],
})

const seedCommunity = async (trx = testDb) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
	return seedCommunity(seed, { randomSlug: false }, trx)
}

const community = await seedCommunity()

const slug = (field: string) => `${communitySlug}:${field.toLowerCase()}`

// helper to run queries
const runQuery = async (expression: string, trx = getTrx()) => {
	const query = compileJsonataQuery(expression)
	const results = await trx
		.selectFrom("pubs")
		.selectAll()
		.where("communityId", "=", community.community.id)
		.where((eb) => applyJsonataFilter(eb, query, { communitySlug }))
		.execute()
	return results.map((r) => r.id)
}

describe("parser", () => {
	it("parses simple equality", () => {
		const result = parseJsonataQuery('$.pub.values.title = "Test"')
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "value", fieldSlug: "title" },
			operator: "=",
			value: "Test",
			pathTransform: undefined,
		})
	})

	it("parses numeric comparison", () => {
		const result = parseJsonataQuery("$.pub.values.number > 40")
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "value", fieldSlug: "number" },
			operator: ">",
			value: 40,
			pathTransform: undefined,
		})
	})

	it("parses logical and", () => {
		const result = parseJsonataQuery('$.pub.values.title = "Test" and $.pub.values.number > 10')
		expect(result.condition.type).toBe("logical")
		if (result.condition.type === "logical") {
			expect(result.condition.operator).toBe("and")
			expect(result.condition.conditions).toHaveLength(2)
		}
	})

	it("parses logical or", () => {
		const result = parseJsonataQuery("$.pub.values.number < 30 or $.pub.values.number > 70")
		expect(result.condition.type).toBe("logical")
		if (result.condition.type === "logical") {
			expect(result.condition.operator).toBe("or")
		}
	})

	it("parses not function", () => {
		const result = parseJsonataQuery('not($.pub.values.title = "Test")')
		expect(result.condition.type).toBe("not")
	})

	it("parses contains function", () => {
		const result = parseJsonataQuery('$contains($.pub.values.title, "important")')
		expect(result.condition).toEqual({
			type: "function",
			name: "contains",
			path: { kind: "value", fieldSlug: "title" },
			arguments: ["important"],
		})
	})

	it("parses in operator with array", () => {
		const result = parseJsonataQuery("$.pub.values.number in [10, 20, 30]")
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "value", fieldSlug: "number" },
			operator: "in",
			value: [10, 20, 30],
			pathTransform: undefined,
		})
	})

	it("parses builtin field id", () => {
		const result = parseJsonataQuery('$.pub.id = "some-id"')
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "builtin", field: "id" },
			operator: "=",
			value: "some-id",
			pathTransform: undefined,
		})
	})

	it("parses builtin field createdAt", () => {
		const result = parseJsonataQuery("$.pub.createdAt > 1704067200000")
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "builtin", field: "createdAt" },
			operator: ">",
			value: 1704067200000,
			pathTransform: undefined,
		})
	})

	it('parses "value in array" as contains', () => {
		const result = parseJsonataQuery('"geology" in $.pub.values.keywords')
		expect(result.condition).toEqual({
			type: "function",
			name: "contains",
			path: { kind: "value", fieldSlug: "keywords" },
			arguments: ["geology"],
		})
	})

	it("parses lowercase transform", () => {
		const result = parseJsonataQuery('$lowercase($.pub.values.title) = "test"')
		expect(result.condition).toEqual({
			type: "comparison",
			path: { kind: "value", fieldSlug: "title" },
			operator: "=",
			value: "test",
			pathTransform: "lowercase",
		})
	})

	it("parses exists function", () => {
		const result = parseJsonataQuery("$exists($.pub.values.title)")
		expect(result.condition).toEqual({
			type: "function",
			name: "exists",
			path: { kind: "value", fieldSlug: "title" },
			arguments: [],
		})
	})

	it("parses complex nested expression", () => {
		const result = parseJsonataQuery(
			'($.pub.values.title = "Test" or $contains($.pub.values.title, "important")) and $.pub.values.number > 10'
		)
		expect(result.condition.type).toBe("logical")
		if (result.condition.type === "logical") {
			expect(result.condition.operator).toBe("and")
			expect(result.condition.conditions[0].type).toBe("logical")
		}
	})
})

describe("sql generation", () => {
	it("generates sql for simple equality", async () => {
		const query = compileJsonataQuery(`$.pub.values.title = "Test Article"`)
		const trx = getTrx()
		const q = trx
			.selectFrom("pubs")
			.selectAll()
			.where("communityId", "=", community.community.id)
			.where((eb) => applyJsonataFilter(eb, query))

		const compiled = q.compile()
		expect(compiled.sql).toContain("pub_values")
		expect(compiled.sql).toContain("pub_fields")
	})

	it("generates sql for numeric comparison", async () => {
		const query = compileJsonataQuery("$.pub.values.number > 40")
		const trx = getTrx()
		const q = trx
			.selectFrom("pubs")
			.selectAll()
			.where("communityId", "=", community.community.id)
			.where((eb) => applyJsonataFilter(eb, query))

		const compiled = q.compile()
		expect(compiled.sql).toContain(">")
	})

	it("generates sql for logical and", async () => {
		const query = compileJsonataQuery(
			`$.pub.values.title = "Test" and $.pub.values.number > 10`
		)
		const trx = getTrx()
		const q = trx
			.selectFrom("pubs")
			.selectAll()
			.where("communityId", "=", community.community.id)
			.where((eb) => applyJsonataFilter(eb, query))

		const compiled = q.compile()
		expect(compiled.sql).toContain("and")
	})
})

describe("database queries", () => {
	it("filters by simple string equality", async () => {
		const ids = await runQuery(`$.pub.values.title = "Test Article"`)
		expect(ids).toContain(titlePubId)
		expect(ids).toHaveLength(1)
	})

	it("filters by numeric greater than", async () => {
		const ids = await runQuery("$.pub.values.number > 50")
		expect(ids).toContain(titlePubId) // 100
		expect(ids).toContain(complexPubId) // 75
		expect(ids).not.toContain(title2PubId) // 50
	})

	it("filters by numeric less than or equal", async () => {
		const ids = await runQuery("$.pub.values.number <= 42")
		expect(ids).toContain(numberPubId) // 25
		expect(ids).toContain(number42PubId) // 42
		expect(ids).not.toContain(titlePubId) // 100
	})

	it("filters with logical and", async () => {
		const ids = await runQuery("$.pub.values.number > 40 and $.pub.values.boolean = true")
		expect(ids).toContain(titlePubId) // 100, true
		expect(ids).toContain(complexPubId) // 75, true
		expect(ids).not.toContain(title2PubId) // 50, false
	})

	it("filters with logical or", async () => {
		const ids = await runQuery("$.pub.values.number < 30 or $.pub.values.number > 90")
		expect(ids).toContain(numberPubId) // 25
		expect(ids).toContain(titlePubId) // 100
		expect(ids).not.toContain(title2PubId) // 50
	})

	it("filters with not", async () => {
		const ids = await runQuery('not($.pub.values.title = "Test Article")')
		expect(ids).not.toContain(titlePubId)
		expect(ids.length).toBeGreaterThan(0)
	})

	it("filters with contains function", async () => {
		const ids = await runQuery('$contains($.pub.values.title, "Article")')
		expect(ids).toContain(titlePubId)
		expect(ids).toContain(title2PubId)
		expect(ids).not.toContain(numberPubId) // "Some Review"
	})

	it("filters with startsWith function", async () => {
		const ids = await runQuery('$startsWith($.pub.values.title, "Test")')
		expect(ids).toContain(titlePubId)
		expect(ids).not.toContain(title2PubId)
	})

	it("filters with endsWith function", async () => {
		const ids = await runQuery('$endsWith($.pub.values.title, "Review")')
		expect(ids).toContain(numberPubId)
		expect(ids).not.toContain(titlePubId)
	})

	it("filters with in operator", async () => {
		const ids = await runQuery("$.pub.values.number in [25, 42, 100]")
		expect(ids).toContain(numberPubId) // 25
		expect(ids).toContain(number42PubId) // 42
		expect(ids).toContain(titlePubId) // 100
		expect(ids).not.toContain(title2PubId) // 50
	})

	it("filters with exists", async () => {
		const ids = await runQuery("$exists($.pub.values.array)")
		expect(ids).toContain(arrayPubId)
		expect(ids).toContain(complexPubId)
		expect(ids).not.toContain(titlePubId)
	})

	it("filters with complex nested expression", async () => {
		const ids = await runQuery(
			'($contains($.pub.values.title, "Article") or $contains($.pub.values.title, "Document")) and $.pub.values.number >= 50'
		)
		expect(ids).toContain(titlePubId) // "Test Article", 100
		expect(ids).toContain(title2PubId) // "Another Article", 50
		expect(ids).toContain(complexPubId) // "Important Document", 75
		expect(ids).not.toContain(numberPubId) // "Some Review"
	})

	it("filters by builtin id field", async () => {
		const ids = await runQuery(`$.pub.id = "${titlePubId}"`)
		expect(ids).toEqual([titlePubId])
	})

	it("filters with inequality", async () => {
		const ids = await runQuery("$.pub.values.number != 42")
		expect(ids).not.toContain(number42PubId)
		expect(ids).toContain(titlePubId)
	})
})

describe("memory filtering", () => {
	// create mock pubs for memory filtering
	const mockPubs: ProcessedPub<{ withValues: true }>[] = [
		{
			id: "pub-1" as PubsId,
			communityId: "comm-1" as CommunitiesId,
			pubTypeId: "type-1",
			parentId: null,
			createdAt: new Date("2024-01-01"),
			updatedAt: new Date("2024-01-01"),
			values: [
				{
					fieldSlug: "test:title",
					fieldId: "f1",
					value: "Test Article",
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:number",
					fieldId: "f2",
					value: 100,
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:boolean",
					fieldId: "f3",
					value: true,
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
			],
		},
		{
			id: "pub-2" as PubsId,
			communityId: "comm-1" as CommunitiesId,
			pubTypeId: "type-1",
			parentId: null,
			createdAt: new Date("2024-02-01"),
			updatedAt: new Date("2024-02-01"),
			values: [
				{
					fieldSlug: "test:title",
					fieldId: "f1",
					value: "Another Article",
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:number",
					fieldId: "f2",
					value: 50,
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:boolean",
					fieldId: "f3",
					value: false,
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
			],
		},
		{
			id: "pub-3" as PubsId,
			communityId: "comm-1" as CommunitiesId,
			pubTypeId: "type-2",
			parentId: null,
			createdAt: new Date("2024-03-01"),
			updatedAt: new Date("2024-03-01"),
			values: [
				{
					fieldSlug: "test:title",
					fieldId: "f1",
					value: "Important Document",
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:number",
					fieldId: "f2",
					value: 75,
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
				{
					fieldSlug: "test:array",
					fieldId: "f4",
					value: ["geology", "biology"],
					relatedPubId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					lastModifiedBy: "user",
				},
			],
		},
	] as any

	it("filters by string equality", () => {
		const query = compileJsonataQuery('$.pub.values.title = "Test Article"')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-1")
	})

	it("filters by numeric comparison", () => {
		const query = compileJsonataQuery("$.pub.values.number > 60")
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(2)
		expect(result.map((p) => p.id)).toContain("pub-1")
		expect(result.map((p) => p.id)).toContain("pub-3")
	})

	it("filters with logical and", () => {
		const query = compileJsonataQuery(
			"$.pub.values.number > 40 and $.pub.values.boolean = true"
		)
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-1")
	})

	it("filters with logical or", () => {
		const query = compileJsonataQuery("$.pub.values.number < 60 or $.pub.values.number > 90")
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(2)
	})

	it("filters with not", () => {
		const query = compileJsonataQuery('not($.pub.values.title = "Test Article")')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(2)
		expect(result.map((p) => p.id)).not.toContain("pub-1")
	})

	it("filters with contains on string", () => {
		const query = compileJsonataQuery('$contains($.pub.values.title, "Article")')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(2)
	})

	it("filters with contains on array", () => {
		const query = compileJsonataQuery('"geology" in $.pub.values.array')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-3")
	})

	it("filters with startsWith", () => {
		const query = compileJsonataQuery('$startsWith($.pub.values.title, "Test")')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-1")
	})

	it("filters with endsWith", () => {
		const query = compileJsonataQuery('$endsWith($.pub.values.title, "Document")')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-3")
	})

	it("filters with exists", () => {
		const query = compileJsonataQuery("$exists($.pub.values.array)")
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-3")
	})

	it("filters by builtin id", () => {
		const query = compileJsonataQuery('$.pub.id = "pub-2"')
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe("pub-2")
	})

	it("filters with in operator", () => {
		const query = compileJsonataQuery("$.pub.values.number in [50, 100]")
		const result = filterPubsWithJsonata(mockPubs, query)
		expect(result).toHaveLength(2)
	})

	it("single pub match check", () => {
		const query = compileJsonataQuery("$.pub.values.number > 90")
		expect(pubMatchesJsonataQuery(mockPubs[0], query)).toBe(true)
		expect(pubMatchesJsonataQuery(mockPubs[1], query)).toBe(false)
	})
})

describe("comparison with original filter format", () => {
	// these tests verify that jsonata queries produce equivalent results to the original filter syntax

	it("jsonata equality equals original filter equality", async () => {
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub")
		const trx = getTrx()

		// original filter
		const originalResult = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				trx,
				filters: {
					[slug("title")]: { $eq: "Test Article" },
				},
			}
		)

		// jsonata query
		const jsonataIds = await runQuery(`$.pub.values.title = "Test Article"`)

		expect(jsonataIds).toEqual(originalResult.map((p) => p.id))
	})

	it("jsonata numeric gt equals original filter gt", async () => {
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub")
		const trx = getTrx()

		const originalResult = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				trx,
				filters: {
					[slug("number")]: { $gt: 50 },
				},
			}
		)

		const jsonataIds = await runQuery("$.pub.values.number > 50")

		expect(new Set(jsonataIds)).toEqual(new Set(originalResult.map((p) => p.id)))
	})

	it("jsonata and equals original filter and", async () => {
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub")
		const trx = getTrx()

		const originalResult = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				trx,
				filters: {
					$and: [{ [slug("number")]: { $gt: 40 } }, { [slug("boolean")]: { $eq: true } }],
				},
			}
		)

		const jsonataIds = await runQuery(
			"$.pub.values.number > 40 and $.pub.values.boolean = true"
		)

		expect(new Set(jsonataIds)).toEqual(new Set(originalResult.map((p) => p.id)))
	})

	it("jsonata contains equals original filter contains", async () => {
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub")
		const trx = getTrx()

		const originalResult = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				trx,
				filters: {
					[slug("title")]: { $contains: "Article" },
				},
			}
		)

		const jsonataIds = await runQuery('$contains($.pub.values.title, "Article")')

		expect(new Set(jsonataIds)).toEqual(new Set(originalResult.map((p) => p.id)))
	})

	it("jsonata in equals original filter in", async () => {
		const { getPubsWithRelatedValues } = await import("~/lib/server/pub")
		const trx = getTrx()

		const originalResult = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				trx,
				filters: {
					[slug("number")]: { $in: [25, 42, 100] },
				},
			}
		)

		const jsonataIds = await runQuery("$.pub.values.number in [25, 42, 100]")

		expect(new Set(jsonataIds)).toEqual(new Set(originalResult.map((p) => p.id)))
	})
})

describe("search queries", () => {
	it("parses $search function", () => {
		const query = parseJsonataQuery('$search("test query")')
		expect(query.condition).toEqual({
			type: "search",
			query: "test query",
		})
	})

	it("searches for text in pub values", async () => {
		const { db } = await import("~/kysely/database")
		const _trx = getTrx()

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(eb, compileJsonataQuery('$search("Article")'), {
					communitySlug,
				})
			)
			.execute()

		// should find pubs that have "Article" in their values
		expect(results.map((r) => r.id)).toContain(titlePubId)
		expect(results.map((r) => r.id)).toContain(title2PubId)
	})

	it("searches for multiple words", async () => {
		const { db } = await import("~/kysely/database")
		const _trx = getTrx()

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(eb, compileJsonataQuery('$search("Test Article")'), {
					communitySlug,
				})
			)
			.execute()

		// should find pub with both "Test" and "Article"
		expect(results.map((r) => r.id)).toContain(titlePubId)
	})

	it("combines search with other conditions", async () => {
		const { db } = await import("~/kysely/database")
		const _trx = getTrx()

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery('$search("Article") and $.pub.values.number > 60'),
					{ communitySlug }
				)
			)
			.execute()

		// should find pubs with "Article" and number > 60
		expect(results.map((r) => r.id)).toContain(titlePubId)
		expect(results.map((r) => r.id)).not.toContain(title2PubId) // number is 50
	})
})

describe("relation queries", () => {
	it("parses outgoing relation path", () => {
		const query = parseJsonataQuery("$.pub.out.contributors")
		expect(query.condition).toEqual({
			type: "relation",
			direction: "out",
			fieldSlug: "contributors",
			filter: undefined,
		})
	})

	it("parses outgoing relation with value filter", () => {
		const query = parseJsonataQuery('$.pub.out.contributors[$.value = "Editor"]')
		expect(query.condition).toEqual({
			type: "relation",
			direction: "out",
			fieldSlug: "contributors",
			filter: {
				type: "relationComparison",
				path: { kind: "relationValue" },
				operator: "=",
				value: "Editor",
				pathTransform: undefined,
			},
		})
	})

	it("parses outgoing relation with relatedPub value filter", () => {
		const query = parseJsonataQuery(
			'$.pub.out.contributors[$.relatedPub.values.institution = "MIT"]'
		)
		expect(query.condition).toEqual({
			type: "relation",
			direction: "out",
			fieldSlug: "contributors",
			filter: {
				type: "relationComparison",
				path: { kind: "relatedPubValue", fieldSlug: "institution" },
				operator: "=",
				value: "MIT",
				pathTransform: undefined,
			},
		})
	})

	it("parses incoming relation path", () => {
		const query = parseJsonataQuery("$.pub.in.chapters")
		expect(query.condition).toEqual({
			type: "relation",
			direction: "in",
			fieldSlug: "chapters",
			filter: undefined,
		})
	})

	it("parses complex relation filter with and/or", () => {
		const query = parseJsonataQuery(
			'$.pub.out.contributors[$.value = "Editor" and $.relatedPub.values.institution = "MIT"]'
		)
		expect(query.condition.type).toBe("relation")
		const cond = query.condition as any
		expect(cond.filter.type).toBe("relationLogical")
		expect(cond.filter.operator).toBe("and")
	})

	it("finds pubs with outgoing relation", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(eb, compileJsonataQuery("$.pub.out.contributors"), {
					communitySlug,
				})
			)
			.execute()

		// should find articles that have contributors
		expect(results.map((r) => r.id)).toContain(titlePubId)
		expect(results.map((r) => r.id)).toContain(title2PubId)
		// should not find authors (they don't have outgoing contributors)
		expect(results.map((r) => r.id)).not.toContain(author1Id)
	})

	it("filters by relation value", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery('$.pub.out.contributors[$.value = "Editor"]'),
					{ communitySlug }
				)
			)
			.execute()

		// titlePubId has an Editor contributor
		expect(results.map((r) => r.id)).toContain(titlePubId)
		// title2PubId only has "Primary Author"
		expect(results.map((r) => r.id)).not.toContain(title2PubId)
	})

	it("filters by related pub field value", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery(
						'$.pub.out.contributors[$.relatedPub.values.institution = "MIT"]'
					),
					{ communitySlug }
				)
			)
			.execute()

		// titlePubId has Jane Doe from MIT as editor
		expect(results.map((r) => r.id)).toContain(titlePubId)
		// title2PubId has Bob Wilson from Groningen
		expect(results.map((r) => r.id)).not.toContain(title2PubId)
	})

	it("filters by related pub contains function", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery(
						'$.pub.out.contributors[$contains($.relatedPub.values.institution, "University")]'
					),
					{ communitySlug }
				)
			)
			.execute()

		// titlePubId has John Smith from University of Groningen
		expect(results.map((r) => r.id)).toContain(titlePubId)
		// title2PubId has Bob Wilson from University of Groningen
		expect(results.map((r) => r.id)).toContain(title2PubId)
	})

	it("combines relation filter with value and relatedPub conditions", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery(
						'$.pub.out.contributors[$.value = "Primary Author" and $contains($.relatedPub.values.institution, "Groningen")]'
					),
					{ communitySlug }
				)
			)
			.execute()

		// titlePubId has John Smith as Primary Author from Groningen
		expect(results.map((r) => r.id)).toContain(titlePubId)
		// title2PubId has Bob Wilson as Primary Author from Groningen
		expect(results.map((r) => r.id)).toContain(title2PubId)
	})

	it("finds incoming relations", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(eb, compileJsonataQuery("$.pub.in.chapters"), {
					communitySlug,
				})
			)
			.execute()

		// should find chapters that are referenced by books
		expect(results.map((r) => r.id)).toContain(chapter1PubId)
		expect(results.map((r) => r.id)).toContain(chapter2PubId)
		// book should not be found (nothing points to it via chapters)
		expect(results.map((r) => r.id)).not.toContain(bookPubId)
	})

	it("filters incoming relations by source pub field", async () => {
		const { db } = await import("~/kysely/database")

		const results = await db
			.selectFrom("pubs")
			.select("pubs.id")
			.innerJoin("communities", "communities.id", "pubs.communityId")
			.where("communities.slug", "=", communitySlug)
			.where((eb) =>
				applyJsonataFilter(
					eb,
					compileJsonataQuery(
						'$.pub.in.chapters[$contains($.relatedPub.values.title, "Big Book")]'
					),
					{ communitySlug }
				)
			)
			.execute()

		// chapters that belong to "The Big Book"
		expect(results.map((r) => r.id)).toContain(chapter1PubId)
		expect(results.map((r) => r.id)).toContain(chapter2PubId)
	})

	it("enforces max relation depth", () => {
		// this should fail because we nest too many relations
		expect(() => {
			parseJsonataQuery("$.pub.out.a[$.pub.out.b[$.pub.out.c[$.pub.out.d]]]")
		}).toThrow()
	})
})
