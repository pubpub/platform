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

describe("pubpub quata filter", () => {
	it.for([
		[
			"filter by direct title field",
			"$$pubs[title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		[
			"filter by pubType.name relation",
			"$$pubs[pubType.name = 'Basic Pub']",
			(results) => {
				// 3 basic pubs (2 top-level + 1 related)
				expect(results.length).toBeGreaterThanOrEqual(2)
				for (const r of results) {
					expect(r.pubTypeId).toBeDefined()
				}
			},
		],
		[
			"filter by stage.name relation",
			"$$pubs[stage.name = 'Stage 1']",
			(results) => {
				expect(results).toHaveLength(2)
			},
		],
		[
			"filter by values.Title (shorthand expansion)",
			"$$pubs[values.Title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		[
			"$contains on values.Description",
			"$$pubs[$exists(values.description)]",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Another title")
			},
		],
		[
			"combined filter: values and direct field",
			"$$pubs[values.Title = 'Some title' and title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		[
			"filter with projection expression ignores projection",
			'$$pubs[values.Title = "Some title" and title = "Some title"].{ "title": $.title }',
			(results) => {
				// compilePubFilter only applies the filter part
				// projection is handled in-memory by post-fetch-projection
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
	] satisfies TestCase[])("%s", async ([_title, expression, expected]) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)

		const filter = compilePubFilter(expression, {
			communitySlug: community.community.slug,
		})

		// apply the filter directly to a pubs query
		const results = await trx
			.selectFrom("pubs")
			.selectAll()
			.where((eb) => filter.apply(eb, "pubs"))
			.where("pubs.communityId", "=", community.community.id)
			.execute()

		expected(results)
	})
})

describe.only("on pubs", () => {
	it("can filter by quata expression", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const community = await seedCommunity(seed, undefined, trx)
		const { getPubsWithRelatedValues } = await import("../pub")

		const results = await getPubsWithRelatedValues(
			{
				communityId: community.community.id,
			},
			{
				quataExpression: {
					expression: `$$pubs[values['some-relation'].relatedPub.title = 'A pub related to another Pub']`,
					communitySlug: community.community.slug,
				},
			}
		)

		console.log(results.map((r) => r.values))
		expect(results).toHaveLength(1)
		expect(results[0].values.find((v) => v.fieldSlug.includes("some-relation"))?.value).toBe(
			"test relation value"
		)
	})
})
