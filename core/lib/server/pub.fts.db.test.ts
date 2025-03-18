import { describe, expect, expectTypeOf, it } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";

import type { Seed } from "~/seed/createSeed";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/seed/createSeed";

const { createForEachMockedTransaction, testDb } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const communitySeed = createSeed({
	community: {
		name: "test",
		slug: "test-server-pub",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
		stageEditor: {
			role: MemberRole.contributor,
		},
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Description: { schemaName: CoreSchemaType.String },
		Content: { schemaName: CoreSchemaType.String },
		Tags: { schemaName: CoreSchemaType.String },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			Description: { isTitle: false },
			Content: { isTitle: false },
			Tags: { isTitle: false },
		},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Machine Learning Fundamentals",
				Description: "An introduction to basic ML concepts",
				Content: "This article covers neural networks and deep learning basics.",
				Tags: "AI, ML, Technology",
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Deep Learning Applications",
				Description: "Advanced applications of deep learning",
				Content: "Exploring real-world uses of neural networks in computer vision.",
				Tags: "AI, Deep Learning, CV",
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Web Development Guide",
				Description: "Complete guide to modern web development",
				Content: "Learn about React, TypeScript, and Node.js fundamentals.",
				Tags: "Web, JavaScript, Programming",
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Database Design Patterns",
				Description: "Essential patterns for database architecture",
				Content: "Understanding SQL and NoSQL database design principles.",
				Tags: "Database, SQL, Architecture",
			},
		},
	],
});

const seed = async <T extends Seed | undefined>(trx = testDb, seed?: T) => {
	const { seedCommunity } = await import("~/seed/seedCommunity");
	if (!seed) {
		return seedCommunity(communitySeed, undefined, trx);
	}

	const seeded = await seedCommunity(seed, undefined, trx);

	return seeded;
};

describe("fullTextSearch", () => {
	it("should find exact matches in titles", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch(
			"Machine Learning",
			seeded.community.id,
			seeded.users.admin.id
		);

		expect(results).toHaveLength(1);
		expect(results[0].title).toBe("Machine Learning Fundamentals");
		expect(results[0].titleHighlights).toContain("<mark>Machine</mark>");
		expect(results[0].titleHighlights).toContain("<mark>Learning</mark>");
	});

	it("should find matches in content", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch(
			"neural networks",
			seeded.community.id,
			seeded.users.admin.id
		);

		expect(results).toHaveLength(2);
		expect(results.some((r) => r.title === "Machine Learning Fundamentals")).toBe(true);
		expect(results.some((r) => r.title === "Deep Learning Applications")).toBe(true);

		const matchingValues = results[0].matchingValues;
		expect(matchingValues).toBeDefined();
		expect(matchingValues.some((v) => v.highlights.includes("<mark>neural</mark>"))).toBe(true);
		expect(matchingValues.some((v) => v.highlights.includes("<mark>networks</mark>"))).toBe(
			true
		);
	});

	it("should find matches in tags", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch("AI", seeded.community.id, seeded.users.admin.id);

		expect(results).toHaveLength(2);
		expect(results.some((r) => r.title === "Machine Learning Fundamentals")).toBe(true);
		expect(results.some((r) => r.title === "Deep Learning Applications")).toBe(true);

		const matchingValues = results[0].matchingValues;
		expect(matchingValues).toBeDefined();
		expect(matchingValues.some((v) => v.highlights.includes("<mark>AI</mark>"))).toBe(true);
	});

	it("should handle partial word matches", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch("learn", seeded.community.id, seeded.users.admin.id);

		expect(results.length).toBeGreaterThan(0);
		results.forEach((result) => {
			const hasMatch =
				result.title?.toLowerCase().includes("learn") ||
				result.matchingValues.some((v) =>
					(v.value as string).toLowerCase().includes("learn")
				);
			expect(hasMatch).toBe(true);
		});
	});

	it("should rank results by relevance", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch(
			"database SQL",
			seeded.community.id,
			seeded.users.admin.id
		);

		expect(results.length).toBeGreaterThan(0);
		// The pub with both "database" and "SQL" in title/content should be ranked first
		expect(results[0].title).toBe("Database Design Patterns");
	});

	it("should limit results to 10 items", async () => {
		const trx = await getTrx();
		// Create a seed with more than 10 matching items
		const manyPubsSeed = {
			...communitySeed,
			pubs: Array(15)
				.fill(null)
				.map((_, i) => ({
					pubType: "Basic Pub",
					values: {
						Title: `Test Document ${i + 1}`,
						Description: "Contains test keyword",
						Content: "Contains test keyword",
						Tags: "test",
					},
				})),
		} as Seed;

		const seeded = await seed(trx, manyPubsSeed);
		const { fullTextSearch } = await import("./pub");

		const results = await fullTextSearch("test", seeded.community.id, seeded.users.admin.id);

		expect(results).toHaveLength(10);
	});

	it("should handle empty or invalid queries gracefully", async () => {
		const trx = await getTrx();
		const seeded = await seed(trx);
		const { fullTextSearch } = await import("./pub");

		const emptyResults = await fullTextSearch("", seeded.community.id, seeded.users.admin.id);
		expect(emptyResults).toHaveLength(0);

		const invalidResults = await fullTextSearch(
			"!@#$%^",
			seeded.community.id,
			seeded.users.admin.id
		);
		expect(invalidResults).toHaveLength(0);
	});
});
