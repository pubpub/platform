import { describe, expect, test } from "vitest";

import {
	Action,
	CoreSchemaType,
	ElementType,
	InputComponent,
	MemberRole,
	StructuralFormElement,
} from "db/public";

import { mockServerCode } from "~/lib/__tests__/utils";

const { testDb, getLoginData, createForEachMockedTransaction } = await mockServerCode();

const { getTrx, rollback, commit } = createForEachMockedTransaction();

describe("seedCommunity", () => {
	test("Should be able to create some sort of community", async () => {
		const trx = getTrx();

		const seedCommunity = await import("./seedCommunity").then((mod) => mod.seedCommunity);

		const testUserId = crypto.randomUUID();
		const community = await seedCommunity({
			community: {
				name: "test",
				slug: "test",
			},
			pubFields: {
				Title: CoreSchemaType.String,
			},
			pubTypes: {
				Submission: {
					Title: true,
				},
			},
			users: {
				test: {
					id: testUserId,
					role: MemberRole.admin,
				},
				hihi: {
					role: MemberRole.contributor,
				},
			},

			stages: {
				"Stage 1": {
					members: ["test"],
					actions: [
						{
							action: Action.email,
							config: {
								body: "hello nerd",
								subject: "hello nerd",
								recipient: testUserId,
							},
						},
					],
				},
				"Stage 2": {},
			},
			pubs: [
				{
					pubType: "Submission",
					values: {
						Title: "HENK",
					},
					stage: "Stage 1",
					children: [
						{
							pubType: "Submission",
							assignee: "test",
							values: {
								Title: "Freek",
							},
						},
					],
				},
			],
			forms: {
				"submission-form": {
					pubType: "Submission",
					name: "Submission Form",
					elements: [
						{
							type: ElementType.structural,
							element: StructuralFormElement.p,
							content: "# Hey, what is up.",
						},
						{
							type: ElementType.pubfield,
							component: InputComponent.textInput,
							field: "Title",
							config: {
								label: "Title hihihi",
							},
						},
						{
							type: ElementType.button,
							label: "Submit",
							content: "Submit",
							stage: "Stage 1",
						},
					],
				},
			},
			stageConnections: {
				"Stage 1": {
					to: ["Stage 2"],
				},
			},
		});

		console.dir(community, { depth: null });
		expect(community).toBeDefined();
	});
});
