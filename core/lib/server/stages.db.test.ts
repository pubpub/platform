import { describe, expect, test } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("getStages", () => {
	test("permissions", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/seed/seedCommunity");
		const { community, stages, users } = await seedCommunity({
			community: {
				name: "test",
				slug: "test-actions-create-pub",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Description: { schemaName: CoreSchemaType.String },
			},
			pubTypes: {
				"Minimal Pub": {
					Title: { isTitle: true },
				},
			},
			stages: {
				"Stage 1": {
					members: { admin: MemberRole.admin, stage1admin: MemberRole.admin },
				},
				"Stage 2": {
					members: { admin: MemberRole.admin },
				},
				"Stage 3": {
					members: { admin: MemberRole.admin },
				},
			},
			pubs: [
				{
					pubType: "Minimal Pub",
					values: {
						Title: "Some title",
					},
					stage: "Stage 1",
				},
			],
			users: {
				admin: {
					role: MemberRole.admin,
				},
				contributor: {
					role: MemberRole.contributor,
				},
				stage1admin: {
					role: MemberRole.contributor,
				},
			},
		});

		const { getStages } = await import("./stages");

		// Check we can get all stages as admin
		const adminStages = await getStages({
			communityId: community.id,
			userId: users.admin.id,
		}).execute();
		expect(adminStages.map((r) => r.name)).toEqual(Object.keys(stages));

		// Contributor
		const contributorStages = await getStages({
			communityId: community.id,
			userId: users.contributor.id,
		}).execute();
		expect(contributorStages).toEqual([]);

		// Stage 1 admin
		const stage1AdminStages = await getStages({
			communityId: community.id,
			userId: users.stage1admin.id,
		}).execute();
		const stage1 = stages["Stage 1"];
		expect(stage1AdminStages).toMatchObject([{ id: stage1.id, name: stage1.name }]);
	});
});
