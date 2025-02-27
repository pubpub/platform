import { jsonArrayFrom } from "kysely/helpers/postgres";
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
const titleId = crypto.randomUUID() as PubsId;
const title2Id = crypto.randomUUID() as PubsId;
const anotherId = crypto.randomUUID() as PubsId;
const number42Id = crypto.randomUUID() as PubsId;
const number24Id = crypto.randomUUID() as PubsId;
const number54Id = crypto.randomUUID() as PubsId;
const arrayId = crypto.randomUUID() as PubsId;
const numberArrayId = crypto.randomUUID() as PubsId;
const numberArray2Id = crypto.randomUUID() as PubsId;
const relationId = crypto.randomUUID() as PubsId;
const testTitleId = crypto.randomUUID() as PubsId;
const testCaseId = crypto.randomUUID() as PubsId;
const specialCharsId = crypto.randomUUID() as PubsId;
const arrayItem1Id = crypto.randomUUID() as PubsId;
const importantDocId = crypto.randomUUID() as PubsId;

const twenty99 = new Date("2099-01-01");

const seed = createSeed({
	community: {
		name: "test",
		slug: communitySlug,
	},
	pubFields: {
		Title: { schemaName: CoreSchemaType.String },
		Email: { schemaName: CoreSchemaType.Email },
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
			Email: { isTitle: false },
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
			id: titleId,
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
				Email: "test@test.com",
			},
		},
		// {
		// 	id: title2Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Title: "some Title",
		// 		Email: "Test@Test.com",
		// 	},
		// },
		// {
		// 	id: anotherId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Title: "Another title",
		// 		Email: "test2@test.com",
		// 	},
		// },
		{
			id: number42Id,
			pubType: "Basic Pub",
			values: {
				Number: 42,
			},
		},
		// {
		// 	id: number24Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Number: 24,
		// 	},
		// },
		// {
		// 	id: number54Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Number: 54,
		// 	},
		// },
		// {
		// 	id: trueId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Boolean: true,
		// 	},
		// },
		// {
		// 	id: arrayId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Array: ["item1", "item2"],
		// 	},
		// },
		// {
		// 	id: vector3Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Vector3: [0, 0, 0],
		// 	},
		// },
		// {
		// 	id: numberArrayId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		NumberArray: [1, 2, 3],
		// 		Date: twenty99,
		// 	},
		// },
		// {
		// 	id: numberArray2Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		NumberArray: [10, 20, 30, 40],
		// 	},
		// },
		// {
		// 	id: relationId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Relation: null,
		// 		Number: 50,
		// 	},
		// },
		// {
		// 	id: testTitleId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Title: "Test",
		// 		Number: 99,
		// 	},
		// },
		// {
		// 	id: testCaseId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Boolean: true,
		// 		Title: "Test case",
		// 	},
		// },
		// {
		// 	id: specialCharsId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Title: "Some title with special characters & symbols",
		// 	},
		// },
		// {
		// 	id: arrayItem1Id,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Array: ["item1", "item2"],
		// 	},
		// },
		// {
		// 	id: importantDocId,
		// 	pubType: "Basic Pub",
		// 	values: {
		// 		Title: "Test important document",
		// 		Number: 40,
		// 		Date: new Date("2023-02-01T00:00:00.000Z"),
		// 		Boolean: true,
		// 	},
		// },
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

const unifiedTestCases: {
	title: string;
	filter: Filter;
	querystring: string;
	sql: string;
	parameters: (string | number)[];
	foundIds: PubsId[];
}[] = [
	{
		title: "simple equality",
		filter: {
			[slug("title")]: { $eq: "Some title" },
		},
		querystring: `filters[${slug("title")}][$eq]=Some title`,
		sql: `"slug" = $1 and "value" = $2`,
		parameters: [slug("title"), '"Some title"'],
		foundIds: [titleId],
	},
	{
		title: "simple inequality",
		filter: {
			[slug("email")]: { $ne: "test@test.com" },
		},
		querystring: `filters[${slug("email")}][$ne]=test@test.com`,
		sql: `"slug" = $1 and "value" != $2`,
		parameters: [slug("email"), '"test@test.com"'],
		foundIds: [anotherId, title2Id],
	},
	{
		title: "case insensitive equality",
		filter: {
			[slug("title")]: { $eqi: "some title" },
		},
		querystring: `filters[${slug("title")}][$eqi]=some title`,
		sql: `"slug" = $1 and lower(value::text) = $2`,
		parameters: [slug("title"), '"some title"'],
		foundIds: [titleId, title2Id],
	},
	{
		title: "case insensitive inequality",
		filter: {
			[slug("email")]: { $nei: "test@test.com" },
		},
		querystring: `filters[${slug("email")}][$nei]=test@test.com`,
		sql: `"slug" = $1 and lower(value::text) != $2`,
		parameters: [slug("email"), '"test@test.com"'],
		foundIds: [anotherId],
	},
	{
		title: "string contains",
		filter: {
			[slug("title")]: { $contains: "Another" },
		},
		querystring: `filters[${slug("title")}][$contains]=Another`,
		sql: `"slug" = $1 and value::text like $2`,
		parameters: [slug("title"), "%Another%"],
		foundIds: [anotherId],
	},
	{
		title: "string contains case insensitive",
		filter: {
			[slug("title")]: { $containsi: "another" },
		},
		querystring: `filters[${slug("title")}][$containsi]=another`,
		sql: `"slug" = $1 and value::text ilike $2`,
		parameters: [slug("title"), "%another%"],
		foundIds: [anotherId],
	},
	{
		title: "string not contains",
		filter: {
			[slug("email")]: { $notContains: "Test" },
		},
		querystring: `filters[${slug("email")}][$notContains]=Test`,
		sql: `"slug" = $1 and value::text not like $2`,
		parameters: [slug("email"), "%Test%"],
		foundIds: [titleId, anotherId],
	},
	{
		title: "string not contains case insensitive",
		filter: {
			[slug("email")]: { $notContainsi: "Test@" },
		},
		querystring: `filters[${slug("email")}][$notContainsi]=Test@`,
		sql: `"slug" = $1 and value::text not ilike $2`,
		parameters: [slug("email"), "%Test@%"],
		foundIds: [anotherId],
	},
	{
		title: "array contains w/ json path",
		filter: {
			[slug("array")]: { $jsonPath: '$[*] == "item1"' },
		},
		querystring: `filters[${slug("array")}][$jsonPath]=$[*] == "item1"`,
		sql: `"slug" = $1 and "value" @@ $2`,
		parameters: [slug("array"), '$[*] == "item1"'],
		foundIds: [arrayId, arrayItem1Id],
	},
	{
		title: "array specific index value check",
		filter: {
			[slug("numberarray")]: { $jsonPath: "$[1] > 10" },
		},
		querystring: `filters[${slug("numberarray")}][$jsonPath]=$[1] > 10`,
		sql: `"slug" = $1 and "value" @@ $2`,
		parameters: [slug("numberarray"), "$[1] > 10"],
		foundIds: [numberArray2Id],
	},
	{
		title: "nested logical operators",
		filter: {
			$or: [
				{ [slug("title")]: { $eq: "Some title" } },
				{
					$and: [{ [slug("number")]: { $gt: 40 } }, { [slug("number")]: { $lt: 50 } }],
				},
			],
		},
		querystring: `filters[$or][0][${slug("title")}][$eq]=Some title&filters[$or][1][$and][0][${slug("number")}][$gt]=40&filters[$or][1][$and][1][${slug("number")}][$lt]=50`,
		sql: `(("slug" = $1 and "value" = $2) or (("slug" = $3 and "value" > $4) and ("slug" = $5 and "value" < $6)))`,
		parameters: [slug("title"), '"Some title"', slug("number"), 40, slug("number"), 50],
		foundIds: [titleId, number42Id],
	},
	{
		title: "field-level logical operators",
		filter: {
			[slug("number")]: {
				$or: [{ $lt: 40 }, { $gt: 50 }],
			},
		},
		querystring: `filters[${slug("number")}][$or][0][$lt]=40&filters[${slug("number")}][$or][1][$gt]=50`,
		sql: `("slug" = $1 and "value" < $2) or ("slug" = $3 and "value" > $4)`,
		parameters: [slug("number"), 40, slug("number"), 50],
		foundIds: [number24Id, number54Id, testTitleId],
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
		querystring:
			"filters[$or][0][createdAt][$lte]=2025-01-01T00:00:00.000Z&filters[$or][1][createdAt][$gte]=2090-01-01T00:00:00.000Z",
		sql: `"pubs"."createdAt" <= $1 or "pubs"."createdAt" >= $2`,
		parameters: [
			`"${new Date("2025-01-01").toISOString()}"`,
			`"${new Date("2090-01-01").toISOString()}"`,
		],
		foundIds: [trueId, vector3Id],
	},
	{
		title: "date filters",
		filter: {
			[slug("date")]: {
				$eq: twenty99,
			},
		},
		querystring: `filters[${slug("date")}][$eq]=${twenty99.toISOString()}`,
		sql: `"slug" = $1 and "value" = $2`,
		parameters: [slug("date"), `"${twenty99.toISOString()}"`],
		foundIds: [numberArrayId],
	},
	{
		title: "multiple operators on same field should be treated as AND",
		filter: {
			[slug("number")]: { $gt: 40, $lt: 50 },
		},
		querystring: `filters[${slug("number")}][$gt]=40&filters[${slug("number")}][$lt]=50`,
		sql: `"slug" = $1 and "value" > $2 and "value" < $3`,
		parameters: [slug("number"), 40, 50],
		foundIds: [number42Id],
	},
	{
		title: "multiple fields should be treated as AND",
		filter: {
			[slug("title")]: { $eq: "Test" },
			[slug("number")]: { $eq: 99 },
		},
		querystring: `filters[${slug("title")}][$eq]=Test&filters[${slug("number")}][$eq]=99`,
		sql: `("slug" = $1 and "value" = $2) and ("slug" = $3 and "value" = $4)`,
		parameters: [slug("title"), '"Test"', slug("number"), "99"],
		foundIds: [testTitleId],
	},
	{
		title: "boolean coercion",
		filter: {
			[slug("boolean")]: { $eq: true },
		},
		querystring: `filters[${slug("boolean")}][$eq]=true`,
		sql: `"slug" = $1 and "value" = $2`,
		parameters: [slug("boolean"), "true"],
		foundIds: [testCaseId],
	},
	{
		title: "array in operator",
		filter: {
			[slug("number")]: { $in: [1, 2, 3] },
		},
		querystring: `filters[${slug("number")}][$in][]=1&filters[${slug("number")}][$in][]=2&filters[${slug("number")}][$in][]=3`,
		sql: `"slug" = $1 and "value" in ($2, $3, $4)`,
		parameters: [slug("number"), 1, 2, 3],
		foundIds: [number42Id],
	},
	{
		title: "between operator",
		filter: {
			[slug("number")]: { $between: [10, 20] },
		},
		querystring: `filters[${slug("number")}][$between][0]=10&filters[${slug("number")}][$between][1]=20`,
		sql: `"slug" = $1 and ("value" >= $2 and "value" <= $3)`,
		parameters: [slug("number"), 10, 20],
		foundIds: [number42Id],
	},
	{
		title: "null and notNull operators",
		filter: {
			[slug("title")]: { $null: true },
			[slug("number")]: { $notNull: true },
		},
		querystring: `filters[${slug("title")}][$null]&filters[${slug("number")}][$notNull]`,
		sql: `("slug" = $1 and "value" is null) and ("slug" = $2 and "value" is not null)`,
		parameters: [slug("title"), slug("number")],
		foundIds: [relationId],
	},
	{
		title: "top-level logical AND",
		filter: {
			$and: [{ [slug("title")]: { $eq: "Test" } }, { [slug("number")]: { $gt: 10 } }],
		},
		querystring: `filters[$and][0][${slug("title")}][$eq]=Test&filters[$and][1][${slug("number")}][$gt]=10`,
		sql: `("slug" = $1 and "value" = $2) and ("slug" = $3 and "value" > $4)`,
		parameters: [slug("title"), '"Test"', slug("number"), 10],
		foundIds: [testTitleId],
	},
	{
		title: "top-level logical NOT",
		filter: {
			$not: { [slug("title")]: { $eq: "Test" } },
		},
		querystring: `filters[$not][${slug("title")}][$eq]=Test`,
		sql: `not ("slug" = $1 and "value" = $2)`,
		parameters: [slug("title"), '"Test"'],
		foundIds: [titleId, anotherId, specialCharsId, importantDocId],
	},
	{
		title: "complex nested structure",
		filter: {
			$or: [
				{
					$and: [
						{ [slug("title")]: { $containsi: "test" } },
						{ [slug("boolean")]: { $eq: true } },
					],
				},
				{
					$not: {
						[slug("number")]: { $between: [10, 20] },
					},
				},
			],
		},
		querystring: `filters[$or][0][$and][0][${slug("title")}][$containsi]=test&filters[$or][0][$and][1][${slug("boolean")}][$eq]=true&filters[$or][1][$not][${slug("number")}][$between][0]=10&filters[$or][1][$not][${slug("number")}][$between][1]=20`,
		sql: `(("slug" = $1 and value::text ilike $2) and ("slug" = $3 and "value" = $4)) or not ("slug" = $5 and ("value" >= $6 and "value" <= $7))`,
		parameters: [slug("title"), "%test%", slug("boolean"), "true", slug("number"), 10, 20],
		foundIds: [testCaseId],
	},
	{
		title: "multiple array values with coercion",
		filter: {
			[slug("numberarray")]: { $in: [1, 2, 3] },
			[slug("date")]: {
				$in: [new Date("2023-01-01T00:00:00.000Z"), new Date("2023-01-02T00:00:00.000Z")],
			},
		},
		querystring: `filters[${slug("numberarray")}][$in][]=1&filters[${slug("numberarray")}][$in][]=2&filters[${slug("numberarray")}][$in][]=3&filters[${slug("date")}][$in][]=2023-01-01T00:00:00.000Z&filters[${slug("date")}][$in][]=2023-01-02T00:00:00.000Z`,
		sql: `("slug" = $1 and "value" in ($2, $3, $4)) and ("slug" = $5 and "value" in ($6, $7))`,
		parameters: [
			slug("numberarray"),
			1,
			2,
			3,
			slug("date"),
			new Date("2023-01-01T00:00:00.000Z").toISOString(),
			new Date("2023-01-02T00:00:00.000Z").toISOString(),
		],
		foundIds: [numberArrayId],
	},
	{
		title: "URL encoded special characters",
		filter: {
			[slug("title")]: { $contains: "special characters & symbols" },
		},
		querystring: `filters[${slug("title")}][$contains]=special%20characters%20%26%20symbols`,
		sql: `"slug" = $1 and value::text like $2`,
		parameters: [slug("title"), "%special characters & symbols%"],
		foundIds: [specialCharsId],
	},
	{
		title: "mixed type coercion in arrays",
		filter: {
			[slug("mixedarray")]: { $in: ["string", 42, true] },
		},
		querystring: `filters[${slug("mixedarray")}][$in][]=string&filters[${slug("mixedarray")}][$in][]=42&filters[${slug("mixedarray")}][$in][]=true`,
		sql: `"slug" = $1 and "value" in ($2, $3, $4)`,
		parameters: [slug("mixedarray"), "string", 42, true],
		foundIds: [number42Id],
	},
	{
		title: "deeply nested logical operators with multiple field types",
		filter: {
			$and: [
				{
					$or: [
						{ [slug("title")]: { $containsi: "test" } },
						{ [slug("number")]: { $gt: 50 } },
					],
				},
				{
					$not: {
						$or: [
							{ [slug("boolean")]: { $eq: false } },
							{ [slug("date")]: { $lt: new Date("2023-01-01T00:00:00.000Z") } },
						],
					},
				},
			],
		},
		querystring: `filters[$and][0][$or][0][${slug("title")}][$containsi]=test&filters[$and][0][$or][1][${slug("number")}][$gt]=50&filters[$and][1][$not][$or][0][${slug("boolean")}][$eq]=false&filters[$and][1][$not][$or][1][${slug("date")}][$lt]=2023-01-01T00:00:00.000Z`,
		sql: `(("slug" = $1 and value::text ilike $2) or ("slug" = $3 and "value" > $4)) and not (("slug" = $5 and "value" = $6) or ("slug" = $7 and "value" < $8))`,
		parameters: [
			slug("title"),
			"%test%",
			slug("number"),
			50,
			slug("boolean"),
			"false",
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
		],
		foundIds: [number54Id],
	},
	{
		title: "complex filter with all operator types",
		filter: {
			$or: [
				{ [slug("title")]: { $eq: "Test", $containsi: "important" } },
				{ [slug("number")]: { $between: [10, 50] } },
				{
					[slug("date")]: { $gt: new Date("2023-01-01T00:00:00.000Z") },
					[slug("boolean")]: { $eq: true },
				},
				{ [slug("array")]: { $jsonPath: '$[*] == "item1"' } },
			],
		},
		querystring: `filters[$or][0][${slug("title")}][$eq]=Test&filters[$or][0][${slug("title")}][$containsi]=important&filters[$or][1][${slug("number")}][$between][0]=10&filters[$or][1][${slug("number")}][$between][1]=50&filters[$or][2][${slug("date")}][$gt]=2023-01-01T00:00:00.000Z&filters[$or][2][${slug("boolean")}][$eq]=true&filters[$or][3][${slug("array")}][$jsonPath]=$[*] == "item1"`,
		sql: `(("slug" = $1 and "value" = $2 and value::text ilike $3) or ("slug" = $4 and ("value" >= $5 and "value" <= $6)) or (("slug" = $7 and "value" > $8) and ("slug" = $9 and "value" = $10)) or ("slug" = $11 and "value" @@ $12))`,
		parameters: [
			slug("title"),
			'"Test"',
			"%important%",
			slug("number"),
			10,
			50,
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
			slug("boolean"),
			"true",
			slug("array"),
			'$[*] == "item1"',
		],
		foundIds: [testTitleId, testCaseId, specialCharsId, importantDocId],
	},
];

describe("SQL generation", () => {
	it.concurrent.each(unifiedTestCases)(
		"generates correct SQL for $title",
		async ({ filter, sql, parameters }) => {
			const trx = getTrx();
			const q = coolQuery(filter).compiled;
			expect(q.sql).toMatch(sql);
			expect(q.parameters).toEqual(parameters);
		}
	);
});

describe("querystring parsing", () => {
	it.concurrent.each(unifiedTestCases)(
		"correctly parses $title",
		async ({ querystring, filter }) => {
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
		const querystring = `filters[${slug("title")}][$invalid]=test`;
		const parsed = QueryString.parse(querystring);
		const validatedFilter = filterSchema.safeParse(parsed);

		expect(validatedFilter.success).toBe(false);
	});

	it("rejects invalid logical operators", async () => {
		const querystring = `filters[$invalid][0][${slug("title")}][$eq]=test`;
		const parsed = QueryString.parse(querystring);
		const validatedFilter = filterSchema.safeParse(parsed);

		expect(validatedFilter.success).toBe(false);
	});

	it("handles malformed between operator", async () => {
		const querystring = `filters[${slug("number")}][$between]=10`;
		const parsed = QueryString.parse(querystring);
		const validatedFilter = filterSchema.safeParse(parsed);

		expect(validatedFilter.success).toBe(false);
	});

	it("handles malformed array syntax", async () => {
		const querystring = `filters[${slug("number")}][$in]=1,2,3`;
		const parsed = QueryString.parse(querystring);
		const validatedFilter = filterSchema.safeParse(parsed);

		// This should fail because $in expects an array
		expect(validatedFilter.success).toBe(false);
	});
});

describe("filtering", async () => {
	it.concurrent.each(unifiedTestCases)("filters by $title", async ({ sql, filter, foundIds }) => {
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

		const testTitlePub = community.pubs.find((pub) => pub.id === testTitleId);
		const tttpub = await trx
			.with(
				"all_pubs_and_values",
				(db) =>
					db
						.selectFrom("pubs")
						.leftJoin("pub_values as pv", "pv.pubId", "pubs.id")
						.innerJoin("pub_fields as pf", "pf.id", "pv.fieldId")
						.selectAll()
						.select("pubs.id as pId")
						.where("pubs.communityId", "=", community.community.id)
				// .where((eb) => applyFilters(eb, filter))
				// .where("pubs.id", "=", testTitleId)
			)
			.selectFrom("all_pubs_and_values")
			.selectAll("all_pubs_and_values")
			.where((eb) =>
				eb.and([
					eb.exists(
						eb
							.selectFrom("all_pubs_and_values as p")
							.select(eb.lit(1).as("x"))
							.where((eb) =>
								eb.and([
									eb("all_pubs_and_values.slug", "=", slug("email")),
									eb("all_pubs_and_values.value", "=", '"test@test.com"'),
								])
							)
					),
					// eb.exists(
					// 	eb
					// 		.selectFrom("all_pubs_and_values as p")
					// 		.select(eb.lit(1).as("x"))
					// 		.where("all_pubs_and_values.slug", "=", slug("title"))
					// ),
				])
			)
			.distinctOn("all_pubs_and_values.pId")
			.execute();
		console.log(sql);
		console.log(tttpub);
		console.log(pubs, filter);

		expect(
			pubs,
			"Expected the same number of pubs to be returned as the number of specified foundIds"
		).toHaveLength(foundIds.length);

		if (pubs.length === 0) {
			return;
		}

		// Create a set of expected IDs for easier comparison
		const expectedIds = new Set(foundIds);

		// Check that each returned pub has an ID in our expected set
		pubs.forEach((pub) => {
			expect(
				expectedIds.has(pub.id),
				`Pub with ID ${pub.id} was not expected in the results`,
				`Expected to find Pub ${community.pubs.find((cPub) => cPub.id === pub.id)}, but found `
			).toBe(true);
		});
	});
});
