import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";

import type { PubsId, PubTypes, Stages } from "db/public";
import {
	CoreSchemaType,
	ElementType,
	InputComponent,
	InviteStatus,
	MemberRole,
	StructuralFormElement,
} from "db/public";
import { inviteSchema } from "db/types";

import type { CommunitySeedOutput } from "~/prisma/seed/createSeed";
import { mockServerCode } from "~/lib/__tests__/utils";
import { createSeed } from "~/prisma/seed/createSeed";
import { InviteBuilder } from "./InviteBuilder";

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx } = createForEachMockedTransaction();

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
		{
			stage: "Stage 1",
			pubType: "Minimal Pub",
			values: {
				Title: "Minimal pub",
			},
		},
	],
	forms: {
		TestForm: {
			pubType: "Basic Pub",
			elements: [
				{
					type: ElementType.structural,
					content: "hello",
					element: StructuralFormElement.p,
				},
				{
					type: ElementType.pubfield,
					field: "Title",
					component: InputComponent.textInput,
					config: {
						label: "title",
					},
				},
			],
		},
	},
});

let community: CommunitySeedOutput<typeof seed>;

beforeAll(async () => {
	const { seedCommunity } = await import("~/prisma/seed/seedCommunity");
	community = await seedCommunity(seed);
});

describe("InviteBuilder", () => {
	it("should be able to create an invite", async () => {
		const invite = await InviteBuilder.inviteByEmail("test@test.com")
			.invitedBy({ userId: community.users.admin.id })
			.forCommunity(community.community.id)
			.withRole(MemberRole.contributor)
			.create();
		expect(invite).toBeDefined();

		expect(invite).toMatchObject({
			email: "test@test.com",
			token: expect.any(String),
			communityId: community.community.id,
			communityRole: MemberRole.contributor,
			lastModifiedBy: expect.stringMatching(
				/^(user|action-run|api-access-token):[0-9a-f-]{36}\|[0-9]{13}$/
			),
			status: InviteStatus.created,
			lastSentAt: null,
			invitedByUserId: community.users.admin.id,
		});
	});

	it("should be able to create an invite with pubOrStageFormIds", async () => {
		const invite = await InviteBuilder.inviteByEmail("test@test.com")
			.invitedBy({ userId: community.users.admin.id })
			.forCommunity(community.community.id)
			.withRole(MemberRole.admin)
			.forPub(community.pubs[0].id)
			.withRole(MemberRole.contributor)
			.withForms([community.forms.TestForm.id])
			.create();

		expect(invite).toMatchObject({
			pubOrStageFormIds: [community.forms.TestForm.id],
		});
	});
});
