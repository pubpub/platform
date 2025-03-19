import { jsonArrayFrom } from "kysely/helpers/postgres";
import QueryString from "qs";
import { describe, expect, it } from "vitest";

import type { Filter, Json, ProcessedPub } from "contracts";
import type { CommunitiesId, PubsId } from "db/public";
import { filterSchema } from "contracts";
import { CoreSchemaType } from "db/public";

import { createSeed } from "~/prisma/seed/createSeed";
import { mockServerCode } from "../__tests__/utils";
import { applyFieldLevelFilters, applyFilters } from "./pub-filters";

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
		{
			id: title2Id,
			pubType: "Basic Pub",
			values: {
				Title: "some Title",
				Email: "Test@Test.com",
			},
		},
		{
			id: anotherId,
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
				Email: "test2@test.com",
			},
		},
		{
			id: number42Id,
			pubType: "Basic Pub",
			values: {
				Number: 42,
			},
		},
		{
			id: number24Id,
			pubType: "Basic Pub",
			values: {
				Number: 24,
				Date: twenty99,
			},
		},
		{
			id: number54Id,
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
			id: arrayId,
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
			id: numberArrayId,
			pubType: "Basic Pub",
			values: {
				NumberArray: [1, 2, 3],
				Date: twenty99,
			},
		},
		{
			id: numberArray2Id,
			pubType: "Basic Pub",
			values: {
				NumberArray: [10, 20, 30, 40],
			},
		},
		{
			id: relationId,
			pubType: "Basic Pub",
			values: {
				Relation: null,
				Number: 50,
			},
		},
		{
			id: testTitleId,
			pubType: "Basic Pub",
			values: {
				Title: "Test",
				Number: 99,
			},
		},
		{
			id: testCaseId,
			pubType: "Basic Pub",
			values: {
				Date: new Date("2023-02-01T00:00:00.000Z"),
				Boolean: true,
				Title: "Test case",
			},
		},
		{
			id: specialCharsId,
			pubType: "Basic Pub",
			values: {
				Title: "Some title with special characters & symbols",
			},
		},
		{
			id: importantDocId,
			pubType: "Basic Pub",
			values: {
				Title: "Test important document",
				Number: 40,
				Date: new Date("2023-02-01T00:00:00.000Z"),
				Boolean: true,
			},
		},
		{
			pubType: "Basic Pub",
			values: {
				Date: new Date("2022-02-01T00:00:00.000Z"),
				Number: 43,
			},
		},

		{
			pubType: "Basic Pub",
			values: {
				Date: new Date("2024-02-01T00:00:00.000Z"),
				Number: 43,
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
	const { validateFilter: valFilter } = await import("./pub-filters-validate");
	return valFilter(communityId, filter, trx);
};

const slug = (str: string) => `${communitySlug}:${str}`;

const unifiedTestCases: {
	title: string;
	filter: Filter;
	querystring: string;
	/**
	 * null here means to match snapshot
	 */
	sql: string | RegExp | (string | RegExp)[] | null;
	parameters: (string | number | boolean)[];
	foundIds: PubsId[] | ((pubs: ProcessedPub[]) => ProcessedPub[]);
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
		parameters: [slug("email"), "%test@%"],
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
		foundIds: [arrayId],
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
		sql: /exists \(.*"slug" = \$1 and "value" = \$2\).* or \(.*"slug" = \$3 and "value" > \$4\).* and exists \(.*"slug" = \$5 and "value" < \$6\).*\)/,
		parameters: [slug("title"), '"Some title"', slug("number"), 40, slug("number"), 50],
		foundIds: (pubs) =>
			pubs.filter((p) =>
				p.values.some(
					(v) =>
						(v.fieldSlug === slug("title") && v.value === "Some title") ||
						(v.fieldSlug === slug("number") &&
							(v.value as number) > 40 &&
							(v.value as number) < 50)
				)
			),
	},
	{
		title: "field-level logical operators",
		filter: {
			[slug("number")]: {
				$or: { $lt: 40, $gt: 50 }, //[{ $lt: 40 }, { $gt: 50 }],
			},
		},
		querystring: `filters[${slug("number")}][$or][$lt]=40&filters[${slug("number")}][$or][$gt]=50`,
		sql: `"slug" = $1 and ("value" < $2 or "value" > $3)`,
		parameters: [slug("number"), 40, 50],
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
		foundIds: [numberArrayId, number24Id],
	},
	{
		title: "multiple operators on same field should be treated as AND",
		filter: {
			[slug("number")]: { $gt: 40, $lt: 50 },
		},
		querystring: `filters[${slug("number")}][$gt]=40&filters[${slug("number")}][$lt]=50`,
		sql: `"slug" = $1 and ("value" > $2 and "value" < $3)`,
		parameters: [slug("number"), 40, 50],
		foundIds: (pubs) =>
			pubs.filter((p) =>
				p.values.some(
					(v) =>
						v.fieldSlug === slug("number") &&
						(v.value as number) > 40 &&
						(v.value as number) < 50
				)
			),
	},
	{
		title: "multiple fields should be treated as AND",
		filter: {
			[slug("title")]: { $eq: "Test" },
			[slug("number")]: { $eq: 99 },
		},
		querystring: `filters[${slug("title")}][$eq]=Test&filters[${slug("number")}][$eq]=99`,
		sql: /exists \(.*"slug" = \$1 and "value" = \$2\).* and exists \(.*"slug" = \$3 and "value" = \$4\).*/,
		parameters: [slug("title"), '"Test"', slug("number"), 99],
		foundIds: [testTitleId],
	},
	{
		title: "boolean coercion",
		filter: {
			[slug("boolean")]: { $eq: true },
		},
		querystring: `filters[${slug("boolean")}][$eq]=true`,
		sql: `"slug" = $1 and "value" = $2`,
		parameters: [slug("boolean"), true],
		foundIds: [testCaseId, importantDocId, trueId],
	},
	{
		title: "array in operator",
		filter: {
			[slug("number")]: { $in: [42, 24] },
		},
		querystring: `filters[${slug("number")}][$in][]=42&filters[${slug("number")}][$in][]=24`,
		sql: `"slug" = $1 and "value" in ($2, $3)`,
		parameters: [slug("number"), 42, 24],
		foundIds: [number42Id, number24Id],
	},
	{
		title: "between operator",
		filter: {
			[slug("number")]: { $between: [20, 25] },
		},
		querystring: `filters[${slug("number")}][$between][0]=20&filters[${slug("number")}][$between][1]=25`,
		sql: `"slug" = $1 and ("value" >= $2 and "value" <= $3)`,
		parameters: [slug("number"), 20, 25],
		foundIds: [number24Id],
	},
	// {
	// 	title: "null and notNull operators",
	// 	filter: {
	// 		[slug("relation")]: { $null: true },
	// 	},
	// 	querystring: `filters[${slug("relation")}][$null]`,
	// 	sql: `"slug" = $1 and "value" is null`,
	// 	parameters: [slug("relation")],
	// 	foundIds: [relationId],
	// },
	{
		title: "exists operator",
		filter: {
			[slug("title")]: { $exists: true },
		},
		querystring: `filters[${slug("title")}][$exists]=true`,
		sql: `exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $1 and true)`,
		parameters: [slug("title")],
		foundIds: (pubs) => pubs.filter((p) => p.values.some((v) => v.fieldSlug === slug("title"))),
	},
	{
		title: "exists operator with false",
		filter: {
			[slug("title")]: { $exists: false },
		},
		querystring: `filters[${slug("title")}][$exists]=false`,
		sql: `not exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $1 and true)`,
		parameters: [slug("title")],
		foundIds: (pubs) =>
			pubs.filter((p) => !p.values.some((v) => v.fieldSlug === slug("title"))),
	},
	{
		title: "top-level logical AND",
		filter: {
			$and: [{ [slug("title")]: { $eq: "Test" } }, { [slug("number")]: { $gt: 10 } }],
		},
		querystring: `filters[$and][0][${slug("title")}][$eq]=Test&filters[$and][1][${slug("number")}][$gt]=10`,
		sql: /exists \(.*"slug" = \$1 and "value" = \$2\).* and exists \(.*"slug" = \$3 and "value" > \$4\).*/,
		parameters: [slug("title"), '"Test"', slug("number"), 10],
		foundIds: [testTitleId],
	},
	{
		title: "top-level logical NOT",
		filter: {
			// this works slightly differently than you'd expect
			$not: { [slug("title")]: { $eq: "Test" } },
		},
		querystring: `filters[$not][${slug("title")}][$eq]=Test`,
		sql: /not exists \(.*"slug" = \$1 and "value" = \$2\).*/,
		parameters: [slug("title"), '"Test"'],
		foundIds: (pubs) =>
			pubs.filter(
				(p) => !p.values.some((v) => v.fieldSlug === slug("title") && v.value === "Test")
			),
	},
	{
		title: "field-level logical NOT",
		filter: {
			[slug("title")]: { $not: { $eq: "Test" } },
		},
		querystring: `filters[${slug("title")}][$not][$eq]=Test`,
		sql: '"slug" = $1 and not "value" = $2',
		parameters: [slug("title"), '"Test"'],
		foundIds: (pubs) =>
			pubs.filter((p) =>
				p.values.some((v) => v.fieldSlug === slug("title") && v.value !== "Test")
			),
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
					[slug("number")]: { $not: { $between: [30, 50] } },
				},
			],
		},
		querystring: `filters[$or][0][$and][0][${slug("title")}][$containsi]=test&filters[$or][0][$and][1][${slug("boolean")}][$eq]=true&filters[$or][1][${slug("number")}][$not][$between][0]=30&filters[$or][1][${slug("number")}][$not][$between][1]=50`,
		sql: [
			/\(exists \(.*"slug" = \$1 and value::text ilike \$2\) and exists \(.*"slug" = \$3 and "value" = \$4\)/,
			/or exists \(.*"slug" = \$5 and not \("value" >= \$6 and "value" <= \$7\)/,
		],
		parameters: [slug("title"), "%test%", slug("boolean"), true, slug("number"), 30, 50],
		foundIds: community.pubs
			.filter(
				(p) =>
					(p.values.some(
						(v) => v.fieldSlug === slug("title") && /test/i.test(v.value as string)
					) &&
						p.values.some(
							(v) => v.fieldSlug === slug("boolean") && v.value === true
						)) ||
					p.values.some(
						(v) =>
							v.fieldSlug === slug("number") &&
							!((v.value as number) >= 30 && (v.value as number) <= 50)
					)
			)
			.map((p) => p.id),
	},
	{
		title: "multiple array values with coercion",
		filter: {
			[slug("number")]: { $in: [20, 24, 45] },
			[slug("date")]: {
				$in: [
					new Date("2023-01-01T00:00:00.000Z"),
					new Date("2023-01-02T00:00:00.000Z"),
					twenty99,
				],
			},
		},
		querystring: `filters[${slug("number")}][$in][]=20&filters[${slug("number")}][$in][]=24&filters[${slug("number")}][$in][]=45&filters[${slug("date")}][$in][]=2023-01-01T00:00:00.000Z&filters[${slug("date")}][$in][]=2023-01-02T00:00:00.000Z&filters[${slug("date")}][$in][]=${twenty99.toISOString()}`,
		sql: [
			`"slug" = $1 and "value" in ($2, $3, $4)) and exists`,
			`"slug" = $5 and "value" in ($6, $7, $8))`,
		],
		parameters: [
			slug("number"),
			20,
			24,
			45,
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
			`"${new Date("2023-01-02T00:00:00.000Z").toISOString()}"`,
			`"${twenty99.toISOString()}"`,
		],
		foundIds: [number24Id],
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
		sql: `select * from "pubs" where ((exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $1 and value::text ilike $2) or exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $3 and "value" > $4)) and not (exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $5 and "value" = $6) or exists (select 1 as "exists_check" from "pub_values" inner join "pub_fields" on "pub_fields"."id" = "pub_values"."fieldId" where "pub_values"."pubId" = "pubs"."id" and "pub_fields"."slug" = $7 and "value" < $8)))`,
		parameters: [
			slug("title"),
			"%test%",
			slug("number"),
			50,
			slug("boolean"),
			false,
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
		],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					(p.values.some(
						(v) => v.fieldSlug === slug("title") && /test/i.test(v.value as string)
					) ||
						p.values.some(
							(v) => v.fieldSlug === slug("number") && (v.value as number) > 50
						)) &&
					!(
						p.values.some(
							(v) => v.fieldSlug === slug("boolean") && (v.value as boolean) === false
						) ||
						p.values.some(
							(v) =>
								v.fieldSlug === slug("date") &&
								(v.value as Date) < new Date("2023-01-01T00:00:00.000Z")
						)
					)
			),
	},
	{
		title: "field level and",
		filter: {
			[slug("number")]: {
				$and: {
					$gte: 40,
					$lte: 45,
				},
			},
		},
		querystring: `filters[${slug("number")}][$and][$gte]=40&filters[${slug("number")}][$and][$lte]=45`,
		sql: `"slug" = $1 and ("value" >= $2 and "value" <= $3)`,
		parameters: [slug("number"), 40, 45],
		foundIds: (pubs) =>
			pubs.filter((p) =>
				p.values.some(
					(v) =>
						v.fieldSlug === slug("number") &&
						(v.value as number) >= 40 &&
						(v.value as number) <= 45
				)
			),
	},
	{
		title: "complex filter with all operator types",
		filter: {
			$or: [
				{ [slug("title")]: { $containsi: "important" } },
				{ [slug("number")]: { $between: [40, 45] } },
				{ [slug("array")]: { $jsonPath: '$[*] == "item1"' } },
				{
					[slug("date")]: { $gt: new Date("2023-01-01T00:00:00.000Z") },
					[slug("boolean")]: { $eq: true },
				},
			],
		},
		querystring: `filters[$or][0][${slug("title")}][$containsi]=important&filters[$or][1][${slug("number")}][$between][0]=40&filters[$or][1][${slug("number")}][$between][1]=45&filters[$or][3][${slug("date")}][$gt]=2023-01-01T00:00:00.000Z&filters[$or][3][${slug("boolean")}][$eq]=true&filters[$or][2][${slug("array")}][$jsonPath]=$[*] == "item1"`,
		sql: [
			'"slug" = $1 and value::text ilike $2) or exists',
			'"slug" = $3 and ("value" >= $4 and "value" <= $5)) or exists',
			'"slug" = $6 and "value" @@ $7) or (exists',
			/exists .*"slug" = \$8 and "value" > \$9.* and exists .*"slug" = \$10 and "value" = \$11.*/,
		],
		parameters: [
			slug("title"),
			"%important%",
			slug("number"),
			40,
			45,
			slug("array"),
			'$[*] == "item1"',
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
			slug("boolean"),
			true,
		],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					p.values.some(
						(v) =>
							(v.fieldSlug === slug("title") &&
								/important/i.test(v.value as string)) ||
							(v.fieldSlug === slug("number") &&
								(v.value as number) > 40 &&
								(v.value as number) < 45) ||
							(v.fieldSlug === slug("array") &&
								(v.value as string[]).includes("item1"))
					) ||
					// $or object
					(p.values.some(
						(v) =>
							v.fieldSlug === slug("date") &&
							new Date(v.value as string) > new Date("2023-01-01T00:00:00.000Z")
					) &&
						p.values.some((v) => v.fieldSlug === slug("boolean") && v.value === true))
			),
	},
	{
		title: "not not",
		filter: {
			$not: {
				$not: {
					[slug("number")]: {
						$eq: 42,
					},
				},
			},
		},
		querystring: `filters[$not][$not][${slug("number")}][$eq]=42`,
		sql: /where not not exists \(.*"slug" = \$1 and "value" = \$2\).*/,
		parameters: [slug("number"), 42],
		foundIds: (pubs) =>
			pubs.filter((p) =>
				p.values.some((v) => v.fieldSlug === slug("number") && v.value == 42)
			),
	},
	{
		title: "not slug not",
		filter: {
			$not: {
				[slug("number")]: {
					$not: {
						$eq: 42,
					},
				},
			},
		},
		querystring: `filters[$not][${slug("number")}][$not][$eq]=42`,
		sql: /where not exists \(.*"slug" = \$1 and not "value" = \$2\).*/,
		parameters: [slug("number"), 42],
		foundIds: (pubs) =>
			pubs.filter(
				(p) => !p.values.some((v) => v.fieldSlug === slug("number") && v.value !== 42)
			),
	},
	{
		title: "array syntax: complex mixture of field and top-level logical operators",
		filter: {
			$or: [
				{
					$and: [
						{
							[slug("title")]: {
								$or: [{ $containsi: "test" }, { $containsi: "important" }],
							},
						},
						{
							[slug("boolean")]: { $eq: true },
						},
					],
				},
				{
					$and: [
						{
							[slug("number")]: {
								$and: [{ $gte: 40 }, { $lte: 45 }],
							},
						},
						{
							$not: {
								[slug("date")]: {
									$not: {
										$lt: new Date("2023-01-01T00:00:00.000Z"),
									},
								},
							},
						},
					],
				},
			],
		},
		querystring: `filters[$or][0][$and][0][${slug("title")}][$or][0][$containsi]=test&filters[$or][0][$and][0][${slug("title")}][$or][1][$containsi]=important&filters[$or][0][$and][1][${slug("boolean")}][$eq]=true&filters[$or][1][$and][0][${slug("number")}][$and][0][$gte]=40&filters[$or][1][$and][0][${slug("number")}][$and][1][$lte]=45&filters[$or][1][$and][1][$not][${slug("date")}][$not][$lt]=2023-01-01T00:00:00.000Z`,
		sql: [
			/exists \(.*"slug" = \$1 and \(value::text ilike \$2 or value::text ilike \$3\)\)/,
			/exists \(.*"slug" = \$4 and "value" = \$5\)/,
			/exists \(.*"slug" = \$6 and \("value" >= \$7 and "value" <= \$8\)\)/,
			/not exists \(.*"slug" = \$9 and not "value" < \$10\)/,
		],
		parameters: [
			slug("title"),
			"%test%",
			"%important%",
			slug("boolean"),
			true,
			slug("number"),
			40,
			45,
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
		],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					// Top-level OR:
					// First condition: Title contains "test"/"important" AND boolean is true
					(p.values.some(
						(v) =>
							v.fieldSlug === slug("title") &&
							(/test/i.test(v.value as string) ||
								/important/i.test(v.value as string))
					) &&
						p.values.some(
							(v) => v.fieldSlug === slug("boolean") && v.value === true
						)) ||
					// Second condition: Number between 40-45 AND date NOT earlier than 2023-01-01
					(p.values.some(
						(v) =>
							v.fieldSlug === slug("number") &&
							(v.value as number) >= 40 &&
							(v.value as number) <= 45
					) &&
						!p.values.some(
							(v) =>
								v.fieldSlug === slug("date") &&
								(v.value as Date) >= new Date("2023-01-01T00:00:00.000Z")
						))
			),
	},
	{
		title: "object syntax: complex mixture of field and top-level logical operators ",
		filter: {
			$or: {
				// Top-level $or with object syntax
				$and: {
					// Top-level $and with object syntax
					[slug("title")]: {
						$or: {
							// Field-level $or with object syntax
							$containsi: "test",
							$startsWithi: "test",
						},
					},
					[slug("date")]: {
						$not: {
							// Field-level $not
							$lt: new Date("2023-01-01T00:00:00.000Z"),
						},
					},
				},
				$not: {
					// Top-level $not
					$and: {
						// Top-level $and inside $not
						[slug("number")]: {
							$not: {
								// Field-level $not
								$between: [0, 30],
							},
						},
						[slug("boolean")]: { $eq: false },
					},
				},
			},
		},
		querystring: `filters[$or][$and][${slug("title")}][$or][$containsi]=test&filters[$or][$and][${slug("title")}][$or][$startsWithi]=test&filters[$or][$and][${slug("date")}][$not][$lt]=2023-01-01T00:00:00.000Z&filters[$or][$not][$and][${slug("number")}][$not][$between][0]=0&filters[$or][$not][$and][${slug("number")}][$not][$between][1]=30&filters[$or][$not][$and][${slug("boolean")}][$eq]=false`,
		sql: null,
		parameters: [
			slug("title"),
			"%test%",
			"test%",
			slug("date"),
			`"${new Date("2023-01-01T00:00:00.000Z").toISOString()}"`,
			slug("number"),
			0,
			30,
			slug("boolean"),
			false,
		],
		// foundIds: [testCaseId, importantDocId],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					// Top-level OR:
					(p.values.some(
						(v) =>
							v.fieldSlug === slug("title") &&
							(/test/i.test(v.value as string) ||
								(v.value as string).toLowerCase().startsWith("test"))
					) &&
						p.values.some(
							(v) =>
								v.fieldSlug === slug("date") &&
								!((v.value as Date) < new Date("2023-01-01T00:00:00.000Z"))
						)) ||
					!(
						p.values.some(
							(v) =>
								v.fieldSlug === slug("number") &&
								!((v.value as number) >= 0 && (v.value as number) <= 30)
						) &&
						p.values.some((v) => v.fieldSlug === slug("boolean") && v.value === false)
					)
			),
	},
	{
		title: "mixed array and object syntax with deeply nested conditions",
		filter: {
			$and: [
				{
					$or: [
						{
							[slug("title")]: {
								$and: {
									$containsi: "test",
									$not: { $containsi: "case" },
								},
							},
						},
						{
							[slug("number")]: {
								$or: {
									$gte: 90,
									$eq: 42,
								},
							},
						},
					],
				},
				{
					$not: {
						$or: {
							[slug("boolean")]: { $eq: false },
							[slug("date")]: {
								$not: {
									$gt: twenty99,
								},
							},
						},
					},
				},
			],
		},
		querystring: `filters[$and][0][$or][0][${slug("title")}][$and][$containsi]=test&filters[$and][0][$or][0][${slug("title")}][$and][$not][$containsi]=case&filters[$and][0][$or][1][${slug("number")}][$or][$gte]=90&filters[$and][0][$or][1][${slug("number")}][$or][$eq]=42&filters[$and][1][$not][$or][${slug("boolean")}][$eq]=false&filters[$and][1][$not][$or][${slug("date")}][$not][$gt]=${twenty99.toISOString()}`,
		sql: null,
		parameters: [
			slug("title"),
			"%test%",
			"%case%",
			slug("number"),
			90,
			42,
			slug("boolean"),
			false,
			slug("date"),
			`"${twenty99.toISOString()}"`,
		],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					// Top-level AND:
					// First condition: (Title contains "test" AND not "garbage") OR (Number >= 90 OR Number = 42)
					(p.values.some(
						(v) =>
							v.fieldSlug === slug("title") &&
							/test/i.test(v.value as string) &&
							!/garbage/i.test(v.value as string)
					) ||
						p.values.some(
							(v) =>
								v.fieldSlug === slug("number") &&
								((v.value as number) >= 90 || (v.value as number) === 42)
						)) &&
					// Second condition: NOT(boolean is false OR date is NOT > twenty99)
					!(
						p.values.some(
							(v) => v.fieldSlug === slug("boolean") && v.value === false
						) ||
						p.values.some(
							(v) => v.fieldSlug === slug("date") && !((v.value as Date) > twenty99)
						)
					)
			),
	},
	{
		title: "multiple field-level logical operators with nested conditions",
		filter: {
			[slug("title")]: {
				$or: {
					// Field-level $or with object
					$containsi: "test",
					$not: {
						// Field-level $not inside $or
						$and: {
							// Field-level $and inside $not
							$containsi: "document",
							$contains: "important",
						},
					},
				},
			},
			[slug("number")]: {
				$and: {
					// Field-level $and with object
					$not: { $lt: 40 },
					$or: [{ $eq: 42 }, { $eq: 99 }],
				},
			},
		},
		querystring: `filters[${slug("title")}][$or][$containsi]=test&filters[${slug("title")}][$or][$not][$and][$containsi]=document&filters[${slug("title")}][$or][$not][$and][$contains]=important&filters[${slug("number")}][$and][$not][$lt]=40&filters[${slug("number")}][$and][$or][0][$eq]=42&filters[${slug("number")}][$and][$or][1][$eq]=99`,
		sql: null,
		parameters: [
			slug("title"),
			"%test%",
			"%document%",
			"%important%",
			slug("number"),
			40,
			42,
			99,
		],
		foundIds: (pubs) =>
			pubs.filter(
				(p) =>
					// Title condition: contains "test" OR NOT(contains "document" AND "important")
					p.values.some(
						(v) =>
							v.fieldSlug === slug("title") &&
							(/test/i.test(v.value as string) ||
								!(
									/document/i.test(v.value as string) &&
									/important/i.test(v.value as string)
								))
					) &&
					// Number condition: NOT < 40 AND (= 42 OR = 99)
					p.values.some(
						(v) =>
							v.fieldSlug === slug("number") &&
							!((v.value as number) < 40) &&
							((v.value as number) === 42 || (v.value as number) === 99)
					)
			),
	},
];

describe("SQL generation", () => {
	it.concurrent.for(unifiedTestCases)(
		"generates correct SQL for $title",
		async ({ filter, sql, parameters }, { expect }) => {
			const q = coolQuery(filter).compiled;
			if (Array.isArray(sql)) {
				sql.forEach((sqlSnippet) => {
					expect(q.sql).toMatch(sqlSnippet);
				});
			} else if (sql === null) {
				expect(q.sql).toMatchSnapshot();
			} else {
				expect(q.sql).toMatch(sql);
			}
			expect(q.parameters).toEqual(parameters);
		}
	);
});

describe("querystring parsing", () => {
	it.concurrent.for(unifiedTestCases)(
		"correctly parses $title",
		async ({ querystring, filter }, { expect }) => {
			const trx = getTrx();
			const parsed = QueryString.parse(querystring, {
				depth: 10,
			});

			// this is a quick check to make sure the querystring is parsed as we think it should be
			expect(
				JSON.stringify(parsed.filters)
					.replace(/([^\\])""/, "$1true")
					.replace(/"/g, ""),
				"Querystring filter should match the defined filter"
			).toEqual(JSON.stringify(filter).replace(/"/g, ""));

			const validatedFilter = filterSchema.safeParse(parsed.filters);

			expect(validatedFilter.error).toBeUndefined();
			expect(validatedFilter.success).toBe(true);

			expect(validatedFilter.data).toEqual(filter);

			await expect(
				validateFilter(community.community.id, validatedFilter.data!, trx)
			).resolves.toBeUndefined();
		}
	);

	it("rejects empty filters", async () => {
		const querystring = "";
		const parsed = QueryString.parse(querystring);
		const validatedFilter = filterSchema.safeParse(parsed);

		expect(validatedFilter.success).toBe(false);
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
	it.for(unifiedTestCases)(
		"filters by $title",
		async ({ filter, foundIds, title }, { expect }) => {
			const trx = getTrx();

			const { getPubsWithRelatedValues } = await import("~/lib/server/pub");

			performance.mark("start");
			const pubs = await getPubsWithRelatedValues(
				{
					communityId: community.community.id,
				},
				{
					trx,
					filters: filter,
				}
			);
			performance.mark("end");
			console.log(
				title,
				"getPubQuerySchema",
				performance.measure(`getPubsWithRelatedValues`, "start", "end").duration
			);

			performance.mark("start");
			const expectedIds =
				typeof foundIds === "function" ? foundIds(pubs).map((p) => p.id) : foundIds;

			expect(
				pubs,
				"Expected the same number of pubs to be returned as the number of specified foundIds"
			).toHaveLength(expectedIds.length);

			if (pubs.length === 0) {
				return;
			}

			const expectedIdsSet = new Set(expectedIds);

			Array.from(expectedIdsSet).forEach((id) => {
				const expectedPub = community.pubs.find((p) => p.id === id);
				const foundPub = pubs.find((p) => p.id === id);
				expect(
					foundPub,
					`Expected to find Pub with values  ${JSON.stringify(expectedPub?.values.map((v) => v.value))} but found pubs with values ${JSON.stringify(pubs.map((p) => p.values.map((v) => v.value)))}`
				).toBeDefined();
			});
			performance.mark("end");
			console.log(title, "expect", performance.measure(`expect`, "start", "end").duration);
		}
	);
});

const validationFailureCases: {
	filter: Filter;
	message: string | RegExp;
}[] = [
	{
		filter: {
			[slug("number")]: { $containsi: "test" },
		},
		message: `Operators [$containsi] are not valid for schema type Number of field ${communitySlug}:number`,
	},
	{
		filter: {
			[slug("title")]: { $gt: 42 },
		},
		message: `Operators [$gt] are not valid for schema type String of field ${communitySlug}:title`,
	},
	{
		filter: {
			[slug("boolean")]: { $contains: true },
		},
		message: `Operators [$contains] are not valid for schema type Boolean of field ${communitySlug}:boolean`,
	},
	{
		filter: {
			createdAt: { $containsi: "2024" },
		},
		message: "Operators [$containsi] are not valid for date field createdAt",
	},
	{
		filter: {
			[slug("number")]: { $containsi: "test", $endsWith: "42", $startsWith: "1" },
		},
		message: `Operators [$containsi, $endsWith, $startsWith] are not valid for schema type Number of field ${communitySlug}:number`,
	},
	{
		filter: {
			$or: [
				{
					[slug("number")]: { $containsi: "test" },
				},
				{
					$and: [
						{
							[slug("number")]: { $gt: 42 },
						},
						{
							[slug("boolean")]: { $contains: true },
						},
					],
				},
			],
		},
		message: /Operators (\[\$containsi\] .*?:number|.*?\[\$contains\] .*?:boolean)/,
	},
	{
		filter: {
			$or: {
				[slug("number")]: { $containsi: "test" },
				$and: [
					{
						[slug("number")]: { $gt: 42 },
					},
					{
						[slug("boolean")]: { $contains: true },
					},
				],
			},
		},
		message: /Operators (\[\$containsi\] .*?:number|.*?\[\$contains\] .*?:boolean)/,
	},
	{
		filter: {
			[slug("number")]: {
				$or: {
					$containsi: "test",
					$endsWith: "42",
				},
			},
		},
		message: `Operators [$containsi, $endsWith] are not valid for schema type Number of field ${communitySlug}:number`,
	},
];

// specific validation failure modes
describe("validation", () => {
	it.concurrent.for(validationFailureCases)(
		"rejects invalid filter: $message",
		async ({ filter, message }, { expect }) => {
			const trx = getTrx();
			await expect(validateFilter(community.community.id, filter, trx)).rejects.toThrow(
				message
			);
		}
	);

	it("allows valid operators in complex nested structures", async () => {
		const trx = getTrx();
		const filter = {
			$or: [
				{
					[slug("number")]: { $gt: 42 },
				},
				{
					$and: [
						{
							[slug("title")]: { $containsi: "test" },
						},
						{
							[slug("boolean")]: { $eq: true },
						},
					],
				},
			],
		};

		await expect(validateFilter(community.community.id, filter, trx)).resolves.toBeUndefined();
	});
});
