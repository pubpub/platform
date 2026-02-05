import type { Generated, Insertable, Kysely as KyselyType, Selectable } from "kysely"

import { Kysely, PostgresDialect, sql } from "kysely"
import Pg from "pg"

// legacy simple test tables (keeping for backward compatibility)
export interface TestItemsTable {
	id: Generated<number>
	name: string
	price: number
	category: string
	inStock: boolean
	createdAt: Generated<Date>
}

export interface TestCategoriesTable {
	id: Generated<number>
	name: string
	description: string | null
}

export interface TestOrdersTable {
	id: Generated<number>
	itemId: number
	quantity: number
	totalPrice: number
	createdAt: Generated<Date>
}

// complex test tables for comprehensive testing
export interface QuataPubsTable {
	id: Generated<number>
	title: string
	status: string
	views: number
	score: number
	author_id: number
	category_id: number
	created_at: Generated<Date>
}

export interface QuataAuthorsTable {
	id: Generated<number>
	name: string
	email: string
	verified: boolean
}

export interface QuataCategoriesTable {
	id: Generated<number>
	name: string
	slug: string
}

export interface QuataCommentsTable {
	id: Generated<number>
	pub_id: number
	author_id: number
	content: string
	likes: number
	created_at: Generated<Date>
}

// complex database interface
export interface ComplexTestDatabase {
	quata_pubs: QuataPubsTable
	quata_authors: QuataAuthorsTable
	quata_categories: QuataCategoriesTable
	quata_comments: QuataCommentsTable
}

// simple database interface (legacy)
export interface TestDatabase {
	quata_items: TestItemsTable
	quata_categories: TestCategoriesTable
	quata_orders: TestOrdersTable
}

export type TestItem = Selectable<TestItemsTable>
export type NewTestItem = Insertable<TestItemsTable>
export type TestCategory = Selectable<TestCategoriesTable>
export type NewTestCategory = Insertable<TestCategoriesTable>
export type TestOrder = Selectable<TestOrdersTable>
export type NewTestOrder = Insertable<TestOrdersTable>

let testDb: Kysely<TestDatabase & ComplexTestDatabase> | null = null

export function getTestDb(): Kysely<TestDatabase & ComplexTestDatabase> {
	if (!testDb) {
		const connectionString =
			process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"

		Pg.types.setTypeParser(20, (val: string) => parseInt(val, 10))

		testDb = new Kysely<TestDatabase & ComplexTestDatabase>({
			dialect: new PostgresDialect({
				pool: new Pg.Pool({ connectionString }),
			}),
		})
	}
	return testDb
}

// complex schema setup for comprehensive tests
export async function setupComplexTestSchema(db: KyselyType<unknown>): Promise<void> {
	// authors table
	await db.schema
		.createTable("quata_authors")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("email", "varchar(255)", (col) => col.notNull())
		.addColumn("verified", "boolean", (col) => col.notNull().defaultTo(false))
		.execute()

	// categories table (for pubs)
	await db.schema
		.createTable("quata_categories")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("slug", "varchar(255)", (col) => col.notNull())
		.execute()

	// pubs table
	await db.schema
		.createTable("quata_pubs")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("title", "varchar(255)", (col) => col.notNull())
		.addColumn("status", "varchar(50)", (col) => col.notNull())
		.addColumn("views", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("score", sql`numeric(5,2)`, (col) => col.notNull().defaultTo(0))
		.addColumn("author_id", "integer", (col) => col.notNull().references("quata_authors.id"))
		.addColumn("category_id", "integer", (col) =>
			col.notNull().references("quata_categories.id")
		)
		.addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
		.execute()

	// comments table
	await db.schema
		.createTable("quata_comments")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("pub_id", "integer", (col) => col.notNull().references("quata_pubs.id"))
		.addColumn("author_id", "integer", (col) => col.notNull().references("quata_authors.id"))
		.addColumn("content", "text", (col) => col.notNull())
		.addColumn("likes", "integer", (col) => col.notNull().defaultTo(0))
		.addColumn("created_at", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
		.execute()
}

export async function teardownComplexTestSchema(db: KyselyType<unknown>): Promise<void> {
	await db.schema.dropTable("quata_comments").ifExists().execute()
	await db.schema.dropTable("quata_pubs").ifExists().execute()
	await db.schema.dropTable("quata_categories").ifExists().execute()
	await db.schema.dropTable("quata_authors").ifExists().execute()
}

export async function seedComplexTestData(db: KyselyType<unknown>): Promise<void> {
	const cdb = db as KyselyType<ComplexTestDatabase>

	// clear existing data
	await cdb.deleteFrom("quata_comments").execute()
	await cdb.deleteFrom("quata_pubs").execute()
	await cdb.deleteFrom("quata_categories").execute()
	await cdb.deleteFrom("quata_authors").execute()

	// seed authors
	await cdb
		.insertInto("quata_authors")
		.values([
			{ name: "Alice Smith", email: "alice@example.com", verified: true },
			{ name: "Bob Jones", email: "bob@example.com", verified: true },
			{ name: "Charlie Brown", email: "charlie@example.com", verified: false },
			{ name: "Diana Prince", email: "diana@example.com", verified: true },
			{ name: "Eve Wilson", email: "eve@example.com", verified: false },
		])
		.execute()

	const authors = await cdb.selectFrom("quata_authors").select(["id", "name"]).execute()
	const authorMap = new Map(authors.map((a) => [a.name, a.id]))

	// seed categories
	await cdb
		.insertInto("quata_categories")
		.values([
			{ name: "Technology", slug: "technology" },
			{ name: "Science", slug: "science" },
			{ name: "Business", slug: "business" },
			{ name: "Arts", slug: "arts" },
		])
		.execute()

	const categories = await cdb.selectFrom("quata_categories").select(["id", "slug"]).execute()
	const catMap = new Map(categories.map((c) => [c.slug, c.id]))

	// seed pubs with varying views, scores, and statuses
	const pubData = [
		{
			title: "Introduction to TypeScript",
			status: "published",
			views: 1200,
			score: 85.5,
			author: "Alice Smith",
			category: "technology",
		},
		{
			title: "Advanced React Patterns",
			status: "published",
			views: 950,
			score: 92.0,
			author: "Bob Jones",
			category: "technology",
		},
		{
			title: "The Future of AI",
			status: "published",
			views: 2500,
			score: 78.3,
			author: "Alice Smith",
			category: "science",
		},
		{
			title: "Startup Guide 2024",
			status: "published",
			views: 800,
			score: 65.0,
			author: "Charlie Brown",
			category: "business",
		},
		{
			title: "Modern Art Trends",
			status: "draft",
			views: 150,
			score: 55.0,
			author: "Diana Prince",
			category: "arts",
		},
		{
			title: "Database Design Patterns",
			status: "published",
			views: 620,
			score: 88.7,
			author: "Bob Jones",
			category: "technology",
		},
		{
			title: "Quantum Computing Basics",
			status: "featured",
			views: 1800,
			score: 95.0,
			author: "Alice Smith",
			category: "science",
		},
		{
			title: "Investment Strategies",
			status: "published",
			views: 450,
			score: 72.5,
			author: "Eve Wilson",
			category: "business",
		},
		{
			title: "Creative Writing Tips",
			status: "draft",
			views: 80,
			score: 60.0,
			author: "Diana Prince",
			category: "arts",
		},
		{
			title: "Machine Learning Guide",
			status: "published",
			views: 1500,
			score: 89.0,
			author: "Bob Jones",
			category: "technology",
		},
		{
			title: "Climate Science Overview",
			status: "published",
			views: 700,
			score: 82.0,
			author: "Charlie Brown",
			category: "science",
		},
		{
			title: "Marketing in Digital Age",
			status: "featured",
			views: 920,
			score: 76.5,
			author: "Eve Wilson",
			category: "business",
		},
	]

	for (const pub of pubData) {
		await cdb
			.insertInto("quata_pubs")
			.values({
				title: pub.title,
				status: pub.status,
				views: pub.views,
				score: pub.score,
				author_id: authorMap.get(pub.author)!,
				category_id: catMap.get(pub.category)!,
			})
			.execute()
	}

	const pubs = await cdb.selectFrom("quata_pubs").select(["id", "title"]).execute()
	const pubMap = new Map(pubs.map((p) => [p.title, p.id]))

	// seed comments
	const commentData = [
		{
			pub: "Introduction to TypeScript",
			author: "Bob Jones",
			content: "Great intro!",
			likes: 45,
		},
		{
			pub: "Introduction to TypeScript",
			author: "Charlie Brown",
			content: "Very helpful",
			likes: 23,
		},
		{
			pub: "The Future of AI",
			author: "Diana Prince",
			content: "Fascinating read",
			likes: 89,
		},
		{
			pub: "The Future of AI",
			author: "Eve Wilson",
			content: "I disagree with some points",
			likes: 12,
		},
		{
			pub: "Advanced React Patterns",
			author: "Alice Smith",
			content: "Excellent patterns",
			likes: 67,
		},
		{
			pub: "Quantum Computing Basics",
			author: "Bob Jones",
			content: "Mind-blowing stuff",
			likes: 102,
		},
		{
			pub: "Machine Learning Guide",
			author: "Diana Prince",
			content: "Practical examples needed",
			likes: 34,
		},
		{
			pub: "Startup Guide 2024",
			author: "Alice Smith",
			content: "Good tips for founders",
			likes: 56,
		},
	]

	for (const comment of commentData) {
		await cdb
			.insertInto("quata_comments")
			.values({
				pub_id: pubMap.get(comment.pub)!,
				author_id: authorMap.get(comment.author)!,
				content: comment.content,
				likes: comment.likes,
			})
			.execute()
	}
}

// legacy schema setup functions
export async function setupTestSchema(db: Kysely<TestDatabase>): Promise<void> {
	await db.schema
		.createTable("quata_categories")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("description", "text")
		.execute()

	await db.schema
		.createTable("quata_items")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("name", "varchar(255)", (col) => col.notNull())
		.addColumn("price", sql`numeric(10,2)`, (col) => col.notNull())
		.addColumn("category", "varchar(255)", (col) => col.notNull())
		.addColumn("inStock", "boolean", (col) => col.notNull().defaultTo(true))
		.addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
		.execute()

	await db.schema
		.createTable("quata_orders")
		.ifNotExists()
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("itemId", "integer", (col) => col.notNull().references("quata_items.id"))
		.addColumn("quantity", "integer", (col) => col.notNull())
		.addColumn("totalPrice", sql`numeric(10,2)`, (col) => col.notNull())
		.addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`now()`))
		.execute()
}

export async function teardownTestSchema(db: Kysely<TestDatabase>): Promise<void> {
	await db.schema.dropTable("quata_orders").ifExists().execute()
	await db.schema.dropTable("quata_items").ifExists().execute()
	await db.schema.dropTable("quata_categories").ifExists().execute()
}

export async function seedTestData(db: Kysely<TestDatabase>): Promise<void> {
	await db.deleteFrom("quata_orders").execute()
	await db.deleteFrom("quata_items").execute()
	await db.deleteFrom("quata_categories").execute()

	await db
		.insertInto("quata_categories")
		.values([
			{ name: "Electronics", description: "Electronic devices and gadgets" },
			{ name: "Books", description: "Physical and digital books" },
			{ name: "Clothing", description: "Apparel and accessories" },
		])
		.execute()

	await db
		.insertInto("quata_items")
		.values([
			{ name: "Laptop", price: 999.99, category: "Electronics", inStock: true },
			{ name: "Phone", price: 699.99, category: "Electronics", inStock: true },
			{ name: "Headphones", price: 199.99, category: "Electronics", inStock: false },
			{ name: "TypeScript Book", price: 49.99, category: "Books", inStock: true },
			{ name: "Design Patterns", price: 59.99, category: "Books", inStock: true },
			{ name: "T-Shirt", price: 29.99, category: "Clothing", inStock: true },
			{ name: "Jeans", price: 79.99, category: "Clothing", inStock: false },
		])
		.execute()

	const items = await db.selectFrom("quata_items").select("id").execute()

	await db
		.insertInto("quata_orders")
		.values([
			{ itemId: items[0].id, quantity: 1, totalPrice: 999.99 },
			{ itemId: items[1].id, quantity: 2, totalPrice: 1399.98 },
			{ itemId: items[3].id, quantity: 3, totalPrice: 149.97 },
		])
		.execute()
}

export async function closeTestDb(): Promise<void> {
	if (testDb) {
		await testDb.destroy()
		testDb = null
	}
}
