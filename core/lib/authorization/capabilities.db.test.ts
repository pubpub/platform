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
			firstName: "Community",
			lastName: "Admin",
			role: MemberRole.admin,
		},
		communityEditor: {
			firstName: "Community",
			lastName: "Editor",
			role: MemberRole.editor,
		},
		communityContributor: {
			firstName: "Community",
			lastName: "Contributor",
			role: MemberRole.contributor,
		},
	},
});

describe("Community membership grants appropriate capabilities", async () => {
	const { userCan } = await import("./capabilities");
	test("Community admin has all capabilities", async () => {
		Object.values(Capabilities).forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.pub, pubId: pubs[0].id },
					users.communityAdmin.id
				)
			).toBe(true);
		});
	});
	test("Community contributor has no capabilities", async () => {
		Object.values(Capabilities).forEach(async (capability) => {
			expect(
				await userCan(
					capability,
					{ type: MembershipType.pub, pubId: pubs[0].id },
					users.communityContributor.id
				)
			).toBe(false);
		});
	});

	test.each([
		["can", Capabilities.movePub],
		["can", Capabilities.createPub],
		["can", Capabilities.viewPub],
		["can", Capabilities.deletePub],
		["can", Capabilities.updatePubValues],
		["can", Capabilities.createRelatedPub],
		["can", Capabilities.createPubWithForm],
		["can", Capabilities.editPubWithForm],
		["can", Capabilities.runAction],
		["can", Capabilities.viewStage],
		["can't", Capabilities.addPubMember],
		["can't", Capabilities.createStage],
	])(`Community editor %s %s`, async (expectation, capability) => {
		expect(
			await userCan(
				capability,
				{
					type: MembershipType.pub,
					pubId: pubs[0].id,
				},
				users.communityEditor.id
			)
		).toBe(expectation === "can");
	});
});
