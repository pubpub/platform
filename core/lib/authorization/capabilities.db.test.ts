import { describe, expect, test } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";
import { Capabilities } from "db/src/public/Capabilities";
import { MembershipType } from "db/src/public/MembershipType";

import { mockServerCode } from "~/lib/__tests__/utils";
import { seedCommunity } from "~/prisma/seed/seedCommunity";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

const { pubs, users } = await seedCommunity({
	community: {
		name: "capabilities-test",
		slug: "capabilities-test",
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
	},
	stages: {
		"Stage 1": {},
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
	],
	users: {
		communityAdmin: {
			firstName: "Admin",
			role: MemberRole.admin,
			password: "password",
		},
		communityEditor: {
			firstName: "Editor",
			role: MemberRole.editor,
			password: "password",
		},
		communityContributor: {
			firstName: "Contributor",
			role: MemberRole.contributor,
			password: "password",
		},
	},
});

describe("Pub membership grants appropriate capabilities", async () => {
	test.each([
		{
			capability: Capabilities.updatePubValues,
			target: { type: MembershipType.pub, pub: pubs[0] },
			user: users.communityAdmin,
			expectation: true,
		},
	] as const)(
		"$user.firstName $capability on pub $pub.values.Title = $expectation",
		async ({
			capability,
			target: {
				type,
				pub: { id: pubId },
			},
			user,
			expectation,
		}) => {
			const { userCan } = await import("./capabilities");

			expect(
				await userCan(
					capability,
					{
						type,
						pubId,
					},
					user.id
				)
			).toBe(expectation);
		}
	);
});
