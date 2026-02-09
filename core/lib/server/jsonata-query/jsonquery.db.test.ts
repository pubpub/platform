/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { describe, expect, it } from "vitest"

import { CoreSchemaType, MemberRole } from "db/public"

import { mockServerCode } from "~/lib/__tests__/utils"
import { createSeed } from "~/prisma/seed/createSeed"

import { compilePubFilter } from "./pubpub-quata"

const { createForEachMockedTransaction } = await mockServerCode()

const { getTrx } = createForEachMockedTransaction()

const seed = createSeed({
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
		"Some relation": { schemaName: CoreSchemaType.String, relation: true },
	},
	pubTypes: {
		"Basic Pub": {
			Title: { isTitle: true },
			"Some relation": { isTitle: false },
		},
		"Minimal Pub": {
			Title: { isTitle: true },
		},
	},
	stages: {
		"Stage 1": {
			members: {
				stageEditor: MemberRole.editor,
			},
		},
		"Stage 2": {},
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "Some title",
			},
			stage: "Stage 1",
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
				Description: "Some description",
			},
			relatedPubs: {
				"Some relation": [
					{
						value: "test relation value",
						pub: {
							pubType: "Basic Pub",
							values: {
								Title: "A pub related to another Pub",
								Description: "Related pub description",
							},
						},
					},
				],
			},
		},
		{
			stage: "Stage 1",
			pubType: "Minimal Pub",
			values: {
				Title: "Minimal pub",
			},
		},
	],
})

type TestCase = [string, string, (results: any[]) => void]

// helper to run a filter test against pubs
async function runFilterTest(
	expression: string,
	communitySlug: string,
	trx: any,
	communityId: string
) {
	const filter = compilePubFilter(expression, { communitySlug })
	return trx
		.selectFrom("pubs")
		.selectAll()
		.where((eb: any) => filter.apply(eb, "pubs"))
		.where("pubs.communityId", "=", communityId)
		.execute()
}

describe("pubpub quata filter", () => {
	it.for([
		// 1. direct field filter
		[
			"direct field: title",
			"$$pubs[title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		// 2. value access with dot notation
		[
			"value access: values.Title",
			"$$pubs[values.Title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		// 3. value access with bracket notation (dashes in slug)
		[
			"value access: values['some-relation'] (bracket notation)",
			"$$pubs[values['some-relation'] = 'test relation value']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
		// 4. schema relation: pubType.name
		[
			"schema relation: pubType.name",
			"$$pubs[pubType.name = 'Minimal Pub']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Minimal pub")
			},
		],
		// 5. schema relation: stage.name
		[
			"schema relation: stage.name",
			"$$pubs[stage.name = 'Stage 1']",
			(results) => {
				expect(results).toHaveLength(2)
			},
		],
		// 6. $contains function on values
		[
			"$contains on values.Description",
			"$$pubs[$contains(values.Description, 'Some')]",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
		// 7. combined boolean filter
		[
			"combined: values AND direct field",
			"$$pubs[values.Title = 'Some title' and title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
			},
		],
	] satisfies TestCase[])("%s", async ([_title, expression, expected]) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)

		const results = await runFilterTest(
			expression,
			community.community.slug,
			trx,
			community.community.id
		)
		expected(results)
	})
})

describe("outgoing relation filters (out)", () => {
	it.for([
		// out['slug'].directField
		[
			"out relation, direct field: out['some-relation'].title",
			"$$pubs[out['some-relation'].title = 'A pub related to another Pub']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
		// out['slug'].values.fieldSlug
		[
			"out relation, value access: out['some-relation'].values.Title",
			"$$pubs[out['some-relation'].values.Title = 'A pub related to another Pub']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
		// out['slug'].values.fieldSlug with description
		[
			"out relation, value access: out['some-relation'].values.Description",
			"$$pubs[out['some-relation'].values.Description = 'Related pub description']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
	] satisfies TestCase[])("%s", async ([_title, expression, expected]) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)

		const results = await runFilterTest(
			expression,
			community.community.slug,
			trx,
			community.community.id
		)
		expected(results)
	})
})

describe("incoming relation filters (in)", () => {
	it.for([
		// in['slug'].directField
		// pub 3 ("A pub related to another Pub") has an incoming relation from pub 2 ("Another title")
		[
			"in relation, direct field: in['some-relation'].title",
			"$$pubs[in['some-relation'].title = 'Another title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("A pub related to another Pub")
			},
		],
		// in['slug'].values.fieldSlug
		[
			"in relation, value access: in['some-relation'].values.Title",
			"$$pubs[in['some-relation'].values.Title = 'Another title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("A pub related to another Pub")
			},
		],
		// in['slug'].values.fieldSlug with description
		[
			"in relation, value access: in['some-relation'].values.Description",
			"$$pubs[in['some-relation'].values.Description = 'Some description']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("A pub related to another Pub")
			},
		],
	] satisfies TestCase[])("%s", async ([_title, expression, expected]) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)

		const results = await runFilterTest(
			expression,
			community.community.slug,
			trx,
			community.community.id
		)
		expected(results)
	})
})

describe("getPubsWithRelatedValues integration", () => {
	it("filters with quataExpression option", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")

		const results = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				quataExpression: {
					expression: "$$pubs[values.Title = 'Some title']",
					communitySlug: community.community.slug,
				},
				trx,
			}
		)

		expect(Array.isArray(results) ? results : [results]).toHaveLength(1)
	})

	it("filters by outgoing relation through getPubsWithRelatedValues", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")

		const results = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				quataExpression: {
					expression:
						"$$pubs[out['some-relation'].title = 'A pub related to another Pub']",
					communitySlug: community.community.slug,
				},
				trx,
			}
		)

		const arr = Array.isArray(results) ? results : [results]
		expect(arr).toHaveLength(1)
		expect(arr[0].title).toBe("Another title")
	})

	it("filters by incoming relation through getPubsWithRelatedValues", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")

		const results = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				quataExpression: {
					expression: "$$pubs[in['some-relation'].title = 'Another title']",
					communitySlug: community.community.slug,
				},
				trx,
			}
		)

		const arr = Array.isArray(results) ? results : [results]
		expect(arr).toHaveLength(1)
		expect(arr[0].title).toBe("A pub related to another Pub")
	})
})

describe("post-fetch projection", () => {
	it("projects values and direct fields from fetched pubs", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")
		const { applyProjection } = await import("./post-fetch-projection")
		const { splitExpression } = await import("./expression-splitter")

		// in the filter portion, expandShorthands lowercases slugs automatically
		// in the projection portion (in-memory jsonata), slugs must match the db (lowercase)
		const fullExpression =
			'$$pubs[values.Title = "Another title"].{ "title": title, "desc": values.description }'
		const split = splitExpression(fullExpression)

		expect(split.hasProjection).toBe(true)
		expect(split.projectionExpression).toBeTruthy()

		// phase 1: filter via sql
		const pubs = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				quataExpression: {
					expression: split.queryExpression,
					communitySlug: community.community.slug,
				},
				trx,
			}
		)

		const arr = Array.isArray(pubs) ? pubs : [pubs]
		expect(arr).toHaveLength(1)

		// phase 2: project in-memory via pub proxy
		const projected = await applyProjection(
			arr,
			split.projectionExpression!,
			community.community.slug
		)

		expect(projected).toHaveLength(1)
		expect((projected[0] as any).title).toBe("Another title")
		expect((projected[0] as any).desc).toBe("Some description")
	})

	it("projects outgoing relation data from fetched pubs", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")
		const { applyProjection } = await import("./post-fetch-projection")

		// fetch the pub that has the outgoing relation
		const pubs = await getPubsWithRelatedValues(
			{ communityId: community.community.id },
			{
				quataExpression: {
					expression: "$$pubs[values.Title = 'Another title']",
					communitySlug: community.community.slug,
				},
				trx,
			}
		)

		const arr = Array.isArray(pubs) ? pubs : [pubs]
		expect(arr).toHaveLength(1)

		// project: extract title and the related pub's title via out
		// note: field slugs are lowercase in the database (slugified),
		// so projection expressions must use lowercase slugs
		const projected = await applyProjection(
			arr,
			'{ "myTitle": title, "relatedTitle": out.`some-relation`.values.title }',
			community.community.slug
		)

		expect(projected).toHaveLength(1)
		const result = projected[0] as any
		expect(result.myTitle).toBe("Another title")
		expect(result.relatedTitle).toBe("A pub related to another Pub")
	})
})
