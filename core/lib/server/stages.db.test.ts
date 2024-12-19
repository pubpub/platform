import { describe, expect, test } from "vitest";

import type { UsersId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { createForEachMockedTransaction, getLoginData, findCommunityBySlug } =
	await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

describe("getStages", () => {
	test("permissions", async () => {
		const trx = getTrx();
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
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
					members: ["admin"],
				},
				"Stage 2": {
					members: ["admin"],
				},
				"Stage 3": {
					members: ["admin"],
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
					firstName: "admin",
					role: MemberRole.admin,
					password: "admin-password",
					email: "admin@example.com",
				},
				contributor: {
					firstName: "contributor",
					role: MemberRole.contributor,
					password: "contributor-password",
					email: "contributor@example.com",
				},
			},
		});

		const { getStages, getStagesUserCanView } = await import("./stages");

		// Check we can get all stages as admin
		const result = await getStages({
			communityId: community.id,
			userId: users.admin.id,
		}).execute();
		expect(result.map((r) => r.name)).toEqual(Object.keys(stages));

		// Filter to only the stages the user has access to
		const adminStages = await getStagesUserCanView({
			communityId: community.id,
			userId: users.admin.id,
		});
		expect(adminStages).toEqual(Object.values(stages).map((s) => s.id));
	});
});
