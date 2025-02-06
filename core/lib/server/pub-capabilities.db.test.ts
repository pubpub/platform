import { describe, expect, it } from "vitest";

import { CoreSchemaType, MemberRole } from "db/public";

import type { Seed } from "~/prisma/seed/seedCommunity";
import { mockServerCode } from "../__tests__/utils";

await mockServerCode();

const seed = {
	community: {
		name: "test-pub-capabilities",
		slug: "test-pub-capabilities",
	},
	users: {
		admin: {
			role: MemberRole.admin,
		},
		editor: {
			role: MemberRole.editor,
		},
		stage1Editor: {
			role: MemberRole.contributor,
		},
		stage2Editor: {
			role: MemberRole.contributor,
		},
		contributor: {
			role: MemberRole.contributor,
		},
		minimalPubMember: {
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
				stage1Editor: MemberRole.editor,
			},
		},
		"Stage 2": {
			members: {
				stage2Editor: MemberRole.editor,
			},
		},
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
			stage: "Stage 2",
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
			members: {
				minimalPubMember: MemberRole.admin,
			},
		},
	],
} as Seed;

describe("getPubsWithRelatedValuesAndChildren capabilities", () => {
	it("should restrict pubs by visibility", async () => {
		const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
		const { community, pubFields, pubTypes, stages, pubs, users } = await seedCommunity(seed);
		const { getPubsWithRelatedValuesAndChildren } = await import("./pub");

		// Admins and editors of the community should see all pubs
		const pubsVisibleToAdmin = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.admin.id,
		});
		// Includes +1 related pub
		expect(pubsVisibleToAdmin.length).toEqual(4);
		// Do the same check for editors
		const pubsVisibleToEditor = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.editor.id,
		});
		expect(pubsVisibleToEditor.length).toEqual(4);

		// Stage member should only see stages they were added to
		const pubsVisibleToStage1Editor = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.stage1Editor.id,
		});
		const stage1 = stages["Stage 1"];
		expect(
			pubsVisibleToStage1Editor.sort((a, b) =>
				a.title ? a.title.localeCompare(b.title || "") : -1
			)
		).toMatchObject([
			{ title: "Minimal pub", stageId: stage1.id },
			{ title: "Some title", stageId: stage1.id },
		]);

		// Check a stage that has a related pub not in the same stage. Should not get the related pub
		const pubsVisibleToStage2Editor = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.stage2Editor.id,
		});
		const stage2 = stages["Stage 2"];
		expect(pubsVisibleToStage2Editor).toMatchObject([
			{ title: "Another title", stageId: stage2.id },
		]);

		// Check a user who is normally a contributor but is admin on one pub
		const pubsVisibleToPubMember = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.minimalPubMember.id,
		});
		expect(pubsVisibleToPubMember).toMatchObject([{ title: "Minimal pub" }]);

		// Contributor should not see any pubs
		const pubsVisibleToContributor = await getPubsWithRelatedValuesAndChildren({
			communityId: community.id,
			userId: users.contributor.id,
		});
		expect(pubsVisibleToContributor.length).toEqual(0);
	}, 15_000);
});
