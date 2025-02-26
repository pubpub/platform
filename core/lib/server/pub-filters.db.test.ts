import QueryString from "qs";
import { describe, expect, it } from "vitest";

import type { Filter, Json } from "contracts";
import type { CommunitiesId, PubsId } from "db/public";
import { filterSchema } from "contracts";
import { CoreSchemaType } from "db/public";

import { createSeed } from "~/prisma/seed/createSeed";
import { mockServerCode } from "../__tests__/utils";
import { applyFilters } from "./pub-filters";

const { createForEachMockedTransaction, testDb } = await mockServerCode();

const { getTrx, rollback } = createForEachMockedTransaction();

const communitySlug = `${new Date().toISOString()}:test-filter-pub`;

const trueId = crypto.randomUUID() as PubsId;
const vector3Id = crypto.randomUUID() as PubsId;

const twenty99 = new Date("2099-01-01");

const seed = createSeed({
	community: {
		name: "test",
		slug: communitySlug,
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Number: { schemaName: CoreSchemaType.Number },
		Boolean: { schemaName: CoreSchemaType.Boolean },
		Date: { schemaName: CoreSchemaType.DateTime },
		Array: { schemaName: CoreSchemaType.StringArray },
		NumberArray: { schemaName: CoreSchemaType.NumericArray },
		Vector3: { schemaName: CoreSchemaType.Vector3 },
		File: { schemaName: CoreSchemaType.FileUpload },
		Relation: { schemaName: CoreSchemaType.Null, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			Number: { isTitle: false },
			Boolean: { isTitle: false },
			Date: { isTitle: false },
			Array: { isTitle: false },
			Vector3: { isTitle: false },
			File: { isTitle: false },
			Relation: { isTitle: false },
			NumberArray: { isTitle: false },
		},
	},
	stages: {},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Number: 42,
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Number: 24,
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Number: 54,
			},
		},
		{
			id: trueId,
			pubType: "Basic Pub",
			values: {
				Boolean: true,
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Array: ["item1", "item2"],
			},
		},
		{
			id: vector3Id,
			pubType: "Basic Pub",
			values: {
				Vector3: [0, 0, 0],
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				NumberArray: [1, 2, 3],
				Date: twenty99,
			},
		},

		{
			pubType: "Basic Pub",
			values: {
				NumberArray: [10, 20, 30, 40],
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Relation: null,
			},
		},
	],
});

// let community: CommunitySeedOutput<typeof seed>;

const seedCommunity = async (trx = testDb) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	const community = await seedCommunity(
		seed,
		{
			// no random slug like usual because we have to define `.each` tests statically
			randomSlug: false,
		},
		trx
	);

	// set the updatedAt for a pub to a weird date
	const p = await trx
		.updateTable("pubs")
		.set({ createdAt: new Date("2024-01-01") })
		.where("id", "=", trueId)
		.returningAll()
		.execute();

	await trx
		.updateTable("pubs")
		.set({ createdAt: twenty99 })
		.where("id", "=", vector3Id)
		.execute();

	return community;
};

const community = await seedCommunity();

// afterAll(async () => {
// 	const { deleteCommunity } = await import("~/prisma/seed/deleteCommunity");
// 	await deleteCommunity(communityId);
// });

const coolQuery = (filter: Filter) => {
	const trx = getTrx();

	const q = trx
		.selectFrom("pubs")
		.selectAll()
		.where((eb) => applyFilters(eb, filter));

	return {
		q,
		compiled: q.compile(),
	};
};

const validateFilter = async (communityId: CommunitiesId, filter: Filter, trx = getTrx()) => {
	const { validateFilter: valFilter } = await import("./validate-filters");
	return valFilter(communityId, filter, trx);
};

const slug = (str: string) => `${communitySlug}:${str}`;

describe("pub-filters", () => {
	describe("filter validation", () => {
		describe("schema", () => {
			it("successfully parses a filter", async () => {
				const filter: Filter = {
					[community.pubFields.Title.slug]: { $eq: "test" },
				};

				const parsed = filterSchema.safeParse(filter);
				expect(parsed.error).toBeUndefined();
				expect(parsed.success).toBe(true);
				expect(parsed.data).toEqual(filter);
			});
		});

		describe("pubField validation", () => {
			it("rejects unknown fields", async () => {
				const filter: Filter = {
					[`${community.community.slug}:unknownField`]: { $eq: "test" },
				};

				await expect(validateFilter(community.community.id, filter)).rejects.toThrow();
			});

			it("only allows valid operators for a field", async () => {
				const filter: Filter = {
					[community.pubFields.Title.slug]: { $invalid: "test" },
				};

				const parsed = filterSchema.safeParse(filter);
				expect(parsed.success).toBe(false);

				await expect(validateFilter(community.community.id, filter)).rejects.toThrow();
			});

			it("does not allow gte on a string field", async () => {
				const filter: Filter = {
					[community.pubFields.Title.slug]: { $gte: "test" },
				};

				const parsed = filterSchema.safeParse(filter);

				expect(parsed.success).toBe(false);

				await expect(validateFilter(community.community.id, filter)).rejects.toThrow(
					/Operators \[\$gte\] are not valid for schema type String/
				);
			});
		});
	});

	const currentDate = new Date();

	const validFilterCases: {
		title: string;
		filter: Filter;
		sql: string;
		parameters: (string | number)[];
		resultValues: { value: Json; fieldSlug?: string }[][];
	}[] = [
		{
			title: "simple equality",
			filter: {
				[slug("title")]: { $eq: "Some title" },
			},
			sql: `"slug" = $1 and "value" = $2`,
			parameters: [slug("title"), '"Some title"'],
			resultValues: [[{ value: "Some title", fieldSlug: slug("title") }]],
		},
		{
			title: "simple inequality",
			filter: {
				[slug("title")]: { $ne: "Some title" },
			},
			sql: `"slug" = $1 and "value" != $2`,
			parameters: [slug("title"), '"Some title"'],
			resultValues: [[{ value: "Another title", fieldSlug: slug("title") }]],
		},
		{
			title: "case insensitive equality",
			filter: {
				[slug("title")]: { $eqi: "some title" },
			},
			sql: `"slug" = $1 and lower(value::text) = $2`,
			parameters: [slug("title"), '"some title"'],
			resultValues: [[{ value: "Some title", fieldSlug: slug("title") }]],
		},
		{
			title: "case insensitive inequality",
			filter: {
				[slug("title")]: { $nei: "some title" },
			},
			sql: `"slug" = $1 and lower(value::text) != $2`,
			parameters: [slug("title"), '"some title"'],
			resultValues: [[{ value: "Another title", fieldSlug: slug("title") }]],
		},
		{
			title: "string contains",
			filter: {
				[slug("title")]: { $contains: "Another" },
			},
			sql: `"slug" = $1 and value::text like $2`,
			parameters: [slug("title"), "%Another%"],
			resultValues: [[{ value: "Another title", fieldSlug: slug("title") }]],
		},
		{
			title: "string contains case insensitive",
			filter: {
				[slug("title")]: { $containsi: "another" },
			},
			sql: `"slug" = $1 and value::text ilike $2`,
			parameters: [slug("title"), "%another%"],
			resultValues: [[{ value: "Another title", fieldSlug: slug("title") }]],
		},
		{
			title: "string not contains",
			filter: {
				[slug("title")]: { $notContains: "Another" },
			},
			sql: `"slug" = $1 and value::text not like $2`,
			parameters: [slug("title"), "%Another%"],
			resultValues: [[{ value: "Some title", fieldSlug: slug("title") }]],
		},
		{
			title: "string not contains case insensitive",
			filter: {
				[slug("title")]: { $notContainsi: "another" },
			},
			sql: `"slug" = $1 and value::text not ilike $2`,
			parameters: [slug("title"), "%another%"],
			resultValues: [[{ value: "Some title", fieldSlug: slug("title") }]],
		},

		{
			title: "array contains w/ json path",
			filter: {
				[slug("array")]: { $jsonPath: '$[*] == "item1"' },
			},
			sql: `"slug" = $1 and "value" @@ $2`,
			parameters: [slug("array"), '$[*] == "item1"'],
			resultValues: [[{ value: ["item1", "item2"], fieldSlug: slug("array") }]],
		},
		{
			title: "array specific index value check",
			filter: {
				[slug("numberarray")]: { $jsonPath: "$[1] > 10" },
			},
			sql: `"slug" = $1 and "value" @@ $2`,
			parameters: [slug("numberarray"), "$[1] > 10"],
			resultValues: [[{ value: [10, 20, 30, 40], fieldSlug: slug("numberarray") }]],
		},
		{
			title: "nested logical operators",
			filter: {
				$or: [
					{ [slug("title")]: { $eq: "Some title" } },
					{
						$and: [
							{ [slug("number")]: { $gt: 40 } },
							{ [slug("number")]: { $lt: 50 } },
						],
					},
				],
			},

			sql: `(("slug" = $1 and "value" = $2) or (("slug" = $3 and "value" > $4) and ("slug" = $5 and "value" < $6)))`,
			parameters: [slug("title"), '"Some title"', slug("number"), 40, slug("number"), 50],
			resultValues: [
				[{ value: 42, fieldSlug: slug("number") }],
				[{ value: "Some title", fieldSlug: slug("title") }],
			],
		},
		{
			title: "nested logical operators",
			filter: {
				[slug("number")]: {
					$or: [
						{
							$lt: 40,
						},
						{
							$gt: 50,
						},
					],
				},
			},

			sql: `("slug" = $1 and "value" < $2) or ("slug" = $3 and "value" > $4)`,
			parameters: [slug("number"), 40, slug("number"), 50],
			resultValues: [
				[{ value: 54, fieldSlug: slug("number") }],
				[{ value: 24, fieldSlug: slug("number") }],
			],
		},
		{
			title: "updatedAt & createdAt filters",
			filter: {
				$or: [
					{
						createdAt: {
							$lte: new Date("2025-01-01"),
						},
					},
					{
						createdAt: {
							$gte: new Date("2090-01-01"),
						},
					},
				],
			},
			sql: `"pubs"."createdAt" <= $1 or "pubs"."createdAt" >= $2`,
			parameters: [
				`"${new Date("2025-01-01").toISOString()}"`,
				`"${new Date("2090-01-01").toISOString()}"`,
			],
			resultValues: [
				[
					{
						value: true,
						fieldSlug: slug("boolean"),
					},
				],
				[{ value: [0, 0, 0], fieldSlug: slug("vector3") }],
			],
		},
		{
			title: "date filters",
			filter: {
				[slug("date")]: {
					$eq: twenty99.toISOString(),
				},
			},
			sql: `"slug" = $1 and "value" = $2`,
			parameters: [slug("date"), `"${twenty99.toISOString()}"`],
			resultValues: [
				[
					{
						value: [1, 2, 3],
						fieldSlug: slug("numberarray"),
					},
					{ value: twenty99.toISOString(), fieldSlug: slug("date") },
				],
			],
		},
	];
	describe("SQL generation", () => {
		it.concurrent.each(validFilterCases)(
			"generates correct SQL for $title",
			async ({ filter, sql, parameters }) => {
				const trx = getTrx();

				const q = coolQuery(filter).compiled;

				expect(q.sql).toMatch(sql);
				expect(q.parameters).toEqual(parameters);
			}
		);
	});

	const invalidFilterCases: {
		title: string;
		filter: Filter;
		error: RegExp;
	}[] = [
		{
			title: "all invalid operators for strings",
			filter: {
				[slug("title")]: {
					$eq: "test",
					$eqi: "test",
					$ne: "test",
					$nei: "test",
					$gt: "test",
					$lt: "test",
					$gte: "test",
					$lte: "test",
					$in: "test",
					$notIn: "test",
					$any: "test",
					$all: "test",
				},
			},
			error: /Operators \[\$gt, \$lt, \$gte, \$lte, \$in, \$notIn, \$any, \$all\] are not valid for schema type String/,
		},
		{
			title: "all invalid operators for numbers",
			filter: {
				[slug("number")]: {
					$startsWith: "test",
					$endsWith: "test",
					$startsWithi: "test",
					$endsWithi: "test",
					$containsi: "test",
					$notContainsi: "test",
					$contains: "test",
					$notContains: "test",
					$any: "test",
					$all: "test",
					$size: "test",
				},
			},
			error: /Operators \[\$startsWith, \$endsWith, \$startsWithi, \$endsWithi, \$containsi, \$notContainsi, \$contains, \$notContains, \$any, \$all, \$size\] are not valid for schema type Number/,
		},
		{
			title: "all invalid operators for booleans",
			filter: {
				[slug("boolean")]: {
					$eq: true,
					$eqi: true,
					$ne: false,
					$nei: false,
					$lt: true,
					$lte: true,
					$gt: false,
					$gte: false,
					$contains: true,
					$notContains: false,
					$containsi: true,
					$notContainsi: false,
					$null: true,
					$notNull: false,
					$between: [true, false],
					$startsWith: true,
					$startsWithi: true,
					$endsWith: true,
					$endsWithi: true,
					$size: 1,
				},
			},
			error: /Operators \[\$eqi, \$nei, \$lt, \$lte, \$gt, \$gte, \$contains, \$notContains, \$containsi, \$notContainsi, \$between, \$startsWith, \$startsWithi, \$endsWith, \$endsWithi, \$size\] are not valid for schema type Boolean/,
		},
		{
			title: "unknown operators",
			filter: {
				[slug("title")]: { $invalid: "test" },
			},
			error: /Operators \[\$invalid\] are not valid for schema type String/,
		},
		{
			title: "unknown fields",
			filter: {
				[slug("unknownField")]: { $eq: "test" },
			},
			error: /Pub values contain fields that do not exist in the community: .*:unknownField/,
		},
	];

	describe("validation", () => {
		it.concurrent.each(validFilterCases)(
			"correctly validates filter for $title",
			async ({ filter }) => {
				const trx = getTrx();
				// const community = await seedCommunity(trx);
				await expect(
					validateFilter(community.community.id, filter, trx)
				).resolves.not.toThrow();
			}
		);

		it.each(invalidFilterCases)("correctly rejects $title", async ({ filter, error }) => {
			const trx = getTrx();
			// const community = await seedCommunity(trx);
			await expect(validateFilter(community.community.id, filter, trx)).rejects.toThrow(
				error
			);
		});
	});

	const querystringCases: {
		title: string;
		querystring: string;
		filter: Filter;
	}[] = [
		{
			title: "simple equality",
			querystring: "filters[title][$eq]=Some title",
			filter: {
				title: { $eq: "Some title" },
			},
		},
		{
			title: "multiple operators on same field",
			querystring: "filters[number][$gt]=10&filters[number][$lt]=50",
			filter: {
				number: { $gt: 10, $lt: 50 },
			},
		},
		{
			title: "multiple fields",
			querystring: "filters[title][$eq]=Test&filters[number][$eq]=42",
			filter: {
				title: { $eq: "Test" },
				number: { $eq: 42 },
			},
		},
		{
			title: "boolean coercion",
			querystring: "filters[boolean][$eq]=true",
			filter: {
				boolean: { $eq: true },
			},
		},
		{
			title: "number coercion",
			querystring: "filters[number][$eq]=42",
			filter: {
				number: { $eq: 42 },
			},
		},
		{
			title: "date coercion",
			querystring: "filters[date][$eq]=2023-01-01T00:00:00.000Z",
			filter: {
				date: { $eq: new Date("2023-01-01T00:00:00.000Z") },
			},
		},
		{
			title: "array in operator",
			querystring:
				"filters[number][$in][]=1&filters[number][$in][]=2&filters[number][$in][]=3",
			filter: {
				number: { $in: [1, 2, 3] },
			},
		},
		{
			title: "between operator",
			querystring: "filters[number][$between][0]=10&filters[number][$between][1]=20",
			filter: {
				number: { $between: [10, 20] },
			},
		},
		{
			title: "case insensitive operators",
			querystring: "filters[title][$containsi]=test&filters[title][$eqi]=another test",
			filter: {
				title: { $containsi: "test", $eqi: "another test" },
			},
		},
		{
			title: "null and notNull operators",
			querystring: "filters[title][$null]&filters[number][$notNull]",
			filter: {
				title: { $null: true },
				number: { $notNull: true },
			},
		},
		{
			title: "jsonPath operator",
			querystring: 'filters[array][$jsonPath]=$[*] == "item1"',
			filter: {
				array: { $jsonPath: '$[*] == "item1"' },
			},
		},
		{
			title: "top-level logical OR",
			querystring: "filters[$or][0][title][$eq]=Test&filters[$or][1][number][$eq]=42",
			filter: {
				$or: [{ title: { $eq: "Test" } }, { number: { $eq: 42 } }],
			},
		},
		{
			title: "top-level logical AND",
			querystring: "filters[$and][0][title][$eq]=Test&filters[$and][1][number][$gt]=10",
			filter: {
				$and: [{ title: { $eq: "Test" } }, { number: { $gt: 10 } }],
			},
		},
		{
			title: "top-level logical NOT",
			querystring: "filters[$not][title][$eq]=Test",
			filter: {
				$not: { title: { $eq: "Test" } },
			},
		},
		{
			title: "nested logical operators",
			querystring:
				"filters[$or][0][title][$eq]=Test&filters[$or][1][$and][0][number][$gt]=10&filters[$or][1][$and][1][number][$lt]=50",
			filter: {
				$or: [
					{ title: { $eq: "Test" } },
					{
						$and: [{ number: { $gt: 10 } }, { number: { $lt: 50 } }],
					},
				],
			},
		},
		{
			title: "field-level logical OR",
			querystring: "filters[number][$or][0][$lt]=10&filters[number][$or][1][$gt]=50",
			filter: {
				number: {
					$or: [{ $lt: 10 }, { $gt: 50 }],
				},
			},
		},
		{
			title: "complex nested structure",
			querystring:
				"filters[$or][0][$and][0][title][$containsi]=test&filters[$or][0][$and][1][boolean][$eq]=true&filters[$or][1][$not][number][$between][0]=10&filters[$or][1][$not][number][$between][1]=20",
			filter: {
				$or: [
					{
						$and: [{ title: { $containsi: "test" } }, { boolean: { $eq: true } }],
					},
					{
						$not: {
							number: { $between: [10, 20] },
						},
					},
				],
			},
		},
		{
			title: "multiple array values with coercion",
			querystring:
				"filters[numberArray][$in][]=1&filters[numberArray][$in][]=2&filters[numberArray][$in][]=3&filters[dateArray][$in][]=2023-01-01T00:00:00.000Z&filters[dateArray][$in][]=2023-01-02T00:00:00.000Z",
			filter: {
				numberArray: { $in: [1, 2, 3] },
				dateArray: {
					$in: [
						new Date("2023-01-01T00:00:00.000Z"),
						new Date("2023-01-02T00:00:00.000Z"),
					],
				},
			},
		},
		{
			title: "URL encoded special characters",
			querystring: "filters[title][$contains]=special%20characters%20%26%20symbols",
			filter: {
				title: { $contains: "special characters & symbols" },
			},
		},
		{
			title: "mixed type coercion in arrays",
			querystring:
				"filters[mixedArray][$in][]=string&filters[mixedArray][$in][]=42&filters[mixedArray][$in][]=true",
			filter: {
				mixedArray: { $in: ["string", 42, true] },
			},
		},
		{
			title: "deeply nested logical operators with multiple field types",
			querystring:
				"filters[$and][0][$or][0][title][$containsi]=test&filters[$and][0][$or][1][number][$gt]=50&filters[$and][1][$not][$or][0][boolean][$eq]=false&filters[$and][1][$not][$or][1][date][$lt]=2023-01-01T00:00:00.000Z",
			filter: {
				$and: [
					{
						$or: [{ title: { $containsi: "test" } }, { number: { $gt: 50 } }],
					},
					{
						$not: {
							$or: [
								{ boolean: { $eq: false } },
								{ date: { $lt: new Date("2023-01-01T00:00:00.000Z") } },
							],
						},
					},
				],
			},
		},
		{
			title: "complex filter with all operator types",
			querystring:
				'filters[$or][0][title][$eq]=Test&filters[$or][0][title][$containsi]=important&filters[$or][1][number][$between][0]=10&filters[$or][1][number][$between][1]=50&filters[$or][2][date][$gt]=2023-01-01T00:00:00.000Z&filters[$or][2][boolean][$eq]=true&filters[$or][3][array][$jsonPath]=$[*] == "item1"',
			filter: {
				$or: [
					{ title: { $eq: "Test", $containsi: "important" } },
					{ number: { $between: [10, 50] } },
					{ date: { $gt: new Date("2023-01-01T00:00:00.000Z") }, boolean: { $eq: true } },
					{ array: { $jsonPath: '$[*] == "item1"' } },
				],
			},
		},
	];
	describe("querystring parsing", () => {
		it.concurrent.each(querystringCases)(
			"correctly parses $title",
			async ({ title, querystring, filter }) => {
				const parsed = QueryString.parse(querystring, {
					depth: 10,
				});

				const validatedFilter = filterSchema.safeParse(parsed.filters);

				expect(validatedFilter.error).toBeUndefined();
				expect(validatedFilter.success).toBe(true);

				expect(validatedFilter.data).toEqual(filter);
			}
		);

		it("handles empty filters", async () => {
			const querystring = "";
			const parsed = QueryString.parse(querystring);
			const validatedFilter = filterSchema.safeParse(parsed);

			expect(validatedFilter.success).toBe(true);
			expect(validatedFilter.data).toEqual({});
		});

		it("rejects invalid operators", async () => {
			const querystring = "filters[title][$invalid]=test";
			const parsed = QueryString.parse(querystring);
			const validatedFilter = filterSchema.safeParse(parsed);

			expect(validatedFilter.success).toBe(false);
		});

		it("rejects invalid logical operators", async () => {
			const querystring = "filters[$invalid][0][title][$eq]=test";
			const parsed = QueryString.parse(querystring);
			const validatedFilter = filterSchema.safeParse(parsed);

			expect(validatedFilter.success).toBe(false);
		});

		it("handles malformed between operator", async () => {
			const querystring = "filters[number][$between]=10";
			const parsed = QueryString.parse(querystring);
			const validatedFilter = filterSchema.safeParse(parsed);

			expect(validatedFilter.success).toBe(false);
		});

		it("handles malformed array syntax", async () => {
			const querystring = "filters[number][$in]=1,2,3";
			const parsed = QueryString.parse(querystring);
			const validatedFilter = filterSchema.safeParse(parsed);

			// This should fail because $in expects an array
			expect(validatedFilter.success).toBe(false);
		});
	});

	describe("filtering", async () => {
		it.concurrent.each(validFilterCases)(
			"filters by $title",
			async ({ filter, resultValues }) => {
				const trx = getTrx();

				const { getPubsWithRelatedValuesAndChildren } = await import("~/lib/server/pub");
				const pubs = await getPubsWithRelatedValuesAndChildren(
					{
						communityId: community.community.id,
					},
					{
						trx,
						filters: filter,
					}
				);

				expect(
					pubs,
					"Expected the same number of pubs to be returned as the number of specified result values"
				).toHaveLength(resultValues.length);

				if (pubs.length === 0) {
					return;
				}

				pubs.sort((a, b) => a.values[0].schemaName.localeCompare(b.values[0].schemaName));

				pubs.forEach((pub, idx) => {
					expect(pub).toHaveValues(resultValues[idx]);
				});
			}
		);
	});
});
