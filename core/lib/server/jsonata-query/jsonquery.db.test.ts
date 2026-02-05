/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { beforeAll, describe, expect, it } from "vitest"

import { createQuata, defineSchema, type Quata } from "@pubpub/quata"
import { CoreSchemaType, MemberRole } from "db/public"

import { mockServerCode } from "~/lib/__tests__/utils"
import { createSeed } from "~/prisma/seed/createSeed"

// import { createLastModifiedBy } from "../lastModifiedBy"

const { createForEachMockedTransaction } = await mockServerCode()

const { getTrx } = createForEachMockedTransaction()

const _seed = createSeed({
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

const schema = defineSchema({
	tables: {
		pubs: {
			fields: {
				id: { type: "string", column: "id" },
				title: { type: "string", column: "title" },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
			},
			relations: {
				stage: {
					target: "stages",
					foreignKey: "stageId",
					targetKey: "id",
					type: "many-to-one",
				},
				pubType: {
					target: "pub_types",
					foreignKey: "pubTypeId",
					type: "many-to-one",
					targetKey: "id",
				},
				community: {
					target: "communities",
					foreignKey: "communityId",
					type: "many-to-one",
					targetKey: "id",
				},
				values: {
					target: "pub_values",
					foreignKey: "id",
					targetKey: "pubId",
					type: "one-to-many",
				},
			},
		},
		stages: {
			fields: {
				id: { type: "string", column: "id" },
				name: { type: "string", column: "name" },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
			},
		},
		pub_types: {
			fields: {
				id: { type: "string", column: "id" },
				name: { type: "string", column: "name" },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
			},
		},
		communities: {
			fields: {
				id: { type: "string", column: "id" },
				name: { type: "string", column: "name" },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
			},
		},
		pub_values: {
			fields: {
				id: { type: "string", column: "id" },
				value: { type: "jsonb", column: "value", nullable: true },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
				relatedPubId: { type: "string", column: "relatedPubId", nullable: true },
			},
			relations: {
				field: {
					target: "pub_fields",
					foreignKey: "fieldId",
					targetKey: "id",
					type: "many-to-one",
				},
			},
		},
		pub_fields: {
			fields: {
				id: { type: "string", column: "id" },
				name: { type: "string", column: "name" },
				slug: { type: "string", column: "slug" },
				schemaName: { type: "string", column: "schemaName" },
				isRelation: { type: "boolean", column: "isRelation" },
				createdAt: { type: "date", column: "createdAt" },
				updatedAt: { type: "date", column: "updatedAt" },
			},
		},
	},
})

let _quata: Quata<typeof schema>

beforeAll(async () => {})
type TestCase =
	| [string, string, (results: any[]) => void]
	| [string, string, (results: any[]) => void, { debug: boolean }]

describe("jsonata query", () => {
	it.for([
		[
			"Simple title filter",
			"$$pubs[title = 'Some title']",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
			},
		],
		[
			"pubtype",
			"$$pubs[pubType.name = 'Basic Pub']",
			(results) => {
				expect(results).toHaveLength(3)
				expect(results[0].pubType.name).toBe("Basic Pub")
				expect(results[1].pubType.name).toBe("Basic Pub")
			},
			{ debug: true },
		],
		[
			"pub values",
			`$$pubs[values.value = '"Some title"']`,
			(results) => {
				expect(results).toHaveLength(1)
				console.log(results[0])
				expect(results[0].values[0].value).toBe("Some title")
			},
			{ debug: true },
		],

		[
			"pub values better",
			"$$pubs[$contains(values.description, 'description')].{ title: $.title, description: $.values.description }",
			(results) => {
				expect(results).toHaveLength(1)
				expect(results[0].title).toBe("Some title")
				expect(results[0].description).toBe("Some description")
			},
			{ debug: true },
		],
	] satisfies TestCase[])("%s", async ([title, expression, expected, options]) => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity")
		const trx = getTrx()
		const _community = await seedCommunity(_seed, undefined, trx)

		const quata = createQuata(schema, trx)
		const query = quata.compile(expression)
		if (options?.debug) {
			console.log("AAAAAAAAAAAAAA")
			console.log(query.sql)
		}
		const queryBuilder = query.toQueryBuilder()
		const resultq = queryBuilder.where("t0.communityId", "=", _community.community.id)

		const results = await resultq.execute()
		expected(results)
	})
})
