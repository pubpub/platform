import { describe, expect, test } from "vitest";

import type { PubsId, UsersId } from "db/public";
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
		const testUserId = crypto.randomUUID() as UsersId;

		const submissionPubId = crypto.randomUUID() as PubsId;
		const authorPubId = crypto.randomUUID() as PubsId;
		const author2PubId = crypto.randomUUID() as PubsId;

		const bigSeed1 = await seedCommunity({
			community: {
				name: "test",
				slug: "test-community",
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				SubmissionAuthor: { schemaName: CoreSchemaType.Number, relation: true },
			},
			pubTypes: {
				Submission: {
					Title: true,
					SubmissionAuthor: true,
				},
				Author: {
					Title: true,
				},
			},
			users: {
				test: {
					id: testUserId,
					firstName: "Testy",
					email: "test@test.com",
					lastName: "McTestFace",
					role: MemberRole.admin,
				},
				hih: {
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
					id: authorPubId,
					pubType: "Author",
					values: {
						Title: "De Heer Frederick I",
					},
				},
				{
					id: submissionPubId,
					pubType: "Submission",
					values: {
						Title: "HENK",
						SubmissionAuthor: { value: 0, relatedPubId: authorPubId },
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
					relatedPubs: {
						SubmissionAuthor: [
							{
								// indicates that it's the first pub
								value: 1,
								relatedPub: {
									pubType: "Author",
									values: {
										Title: "De Heer Frederick III",
									},
								},
							},
						],
					},
				},
				{
					id: author2PubId,
					pubType: "Author",
					values: {
						Title: "De Heer Frederick II",
					},
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
		});

		expect(bigSeed1).toBeDefined();

		expect(bigSeed1.community, "community").toMatchObject({
			name: "test",
		});

		expect(bigSeed1.actions, "actions").toMatchObject([
			{
				action: "email",
				config: {
					body: "hello nerd",
					subject: "hello nerd",
				},
				name: "",
			},
		]);

		expect(bigSeed1.users, "users").toMatchObject([
			{
				isSuperAdmin: false,
			},
			{
				isSuperAdmin: false,
			},
		]);

		expect(bigSeed1.members, "members").toMatchObject([
			{
				role: "admin",
			},
			{
				role: "contributor",
			},
		]);

		expect(bigSeed1.pubFields, "pubFields").toMatchObject([
			{
				isRelation: false,
				name: "Title",
				schemaName: "String",
			},
			{
				isRelation: true,
				name: "SubmissionAuthor",
				schemaName: "Number",
			},
		]);

		expect(bigSeed1.pubTypes, "pubTypes").toMatchObject([
			{
				description: null,
				name: "Submission",
			},
			{
				name: "Author",
			},
		]);

		expect(bigSeed1.pubs, "pubs").toMatchObject([
			{ id: authorPubId },
			{
				id: submissionPubId,
				assigneeId: null,
				children: [
					{
						assigneeId: bigSeed1.users[0].id,
						values: [
							{
								relatedPubId: null,
								value: "Freek",
							},
						],
						valuesBlob: null,
					},
				],
				parentId: null,
				values: [
					{
						relatedPubId: null,
						value: "HENK",
					},
					{
						relatedPubId: authorPubId,
						value: 0,
					},
				],
				valuesBlob: null,
				stageId: bigSeed1.stages.find((stage) => stage.name === "Stage 1")?.id,
				relatedPubs: [
					{
						value: 1,
						relatedPub: {},
					},
				],
			},
			{ id: author2PubId },
		]);

		expect(bigSeed1.stageConnections, "stageConnections").toMatchObject([]);

		expect(bigSeed1.stagePermissions, "stagePermissions").toMatchObject([
			{
				B: bigSeed1.stages.find((stage) => stage.name === "Stage 1")?.id,
			},
		]);

		expect(bigSeed1.stages, "stages").toMatchObject([
			{
				actions: [
					{
						action: "email",
						config: {
							body: "hello nerd",
							subject: "hello nerd",
						},
					},
				],
				members: ["test"],
				name: "Stage 1",
				order: "aa",
			},
			{
				name: "Stage 2",
				order: "bb",
			},
		]);

		expect(bigSeed1.forms, "forms").toMatchObject([
			{
				access: "private",
				elements: [
					{
						component: null,
						config: null,
						content: "# Hey, what is up.",
						element: "p",
						fieldId: null,
						label: null,
						order: 0,
						required: null,
						stageId: null,
						type: "structural",
					},
					{
						component: "textInput",
						config: {
							label: "Title hihihi",
						},
						content: null,
						element: null,
						label: null,
						order: 1,
						required: null,
						stageId: null,
						type: "pubfield",
					},
					{
						component: null,
						config: null,
						content: "Submit",
						element: null,
						fieldId: null,
						label: "Submit",
						order: 2,
						required: null,
						stageId: null,
						type: "button",
					},
				],
				isArchived: false,
				name: "submission-form",
				slug: "submission-form",
			},
		]);

		rollback();
	});
});
