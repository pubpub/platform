import { describe, expect, expectTypeOf, it } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";

import type { Seed } from "~/prisma/seed/seedCommunity";
import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction, testDb } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const communitySeed = {
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
	},
	pubs: [
		{
			pubType: "Basic Pub",
			values: {
				Title: "title",
			},
			stage: "Stage 1",
		},
		{
			pubType: "Basic Pub",
			values: {
				Title: "Another title",
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
} as Seed;

const seed = async (trx = testDb, seed?: Seed) => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	const seeded = await seedCommunity(seed ?? { ...communitySeed }, undefined, trx);

	return seeded;
};

describe("fullTextSearch", () => {
	it("should be able to search for a pub", async () => {
		const trx = await getTrx();
		const seeded = await seed();

		const { fullTextSearch } = await import("./pub");

		const pubs = await fullTextSearch("title", seeded.community.id, seeded.users.admin.id);
		console.dir(pubs, { depth: null });

		const searchVector = await testDb
			.selectFrom("pubs")
			.select("pubs.searchVector")
			.where("pubs.id", "=", seeded.pubs[0].id)
			.executeTakeFirst();

		console.log(searchVector);
		expect(pubs).toHaveLength(1);
	});
});
