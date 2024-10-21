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
				SubmissionAuthor: { schemaName: CoreSchemaType.Null, relation: true },
			},
			pubTypes: {
				Submission: {
					Title: true,
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
			pubs: {
				"A Submission": {
					id: submissionPubId,
					pubType: "Submission",
					values: {
						Title: "HENK",
					},
					stage: "Stage 1",
					children: {
						"Child Submission": {
							pubType: "Submission",
							assignee: "test",
							values: {
								Title: "Freek",
							},
						},
					},
				},
				"Author 1": {
					id: authorPubId,
					pubType: "Author",
					values: {
						Title: "De Heer Frederick",
					},
				},
				"Author 2": {
					id: author2PubId,
					pubType: "Author",
					values: {
						Title: "De Heer Frederick 2",
					},
				},
			},

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
			pubRelations: {
				"A Submission": {
					SubmissionAuthor: ["Author 1", "Author 2"],
				},
			},
		});

		expect(bigSeed1).toBeDefined();

		expect(bigSeed1).toMatchObject({
			actions: [
				{
					action: "email",
					config: {
						body: "hello nerd",
						subject: "hello nerd",
					},
					name: "",
				},
			],
			community: {
				avatar: null,
				name: "test",
			},
			forms: [
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
							fieldId: null,
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
			],
			members: [
				{
					role: "admin",
				},
				{
					role: "contributor",
				},
			],
			pubFields: [
				{
					isRelation: false,
					name: "Title",
					schemaName: "String",
				},
				{
					isRelation: true,
					name: "SubmissionAuthor",
					schemaName: "Null",
				},
			],
			pubTypes: [
				{
					description: null,
					name: "Submission",
				},
				{
					name: "Author",
				},
			],
			pubfieldMaps: [
				{
					A: bigSeed1.pubFields[0].id,
					B: bigSeed1.pubTypes[0].id,
				},
				{},
			],
			pubs: [
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
					],
					valuesBlob: null,
					stageId: "",
				},
				{ id: authorPubId },
				{ id: author2PubId },
			],
			stageConnections: [{}],
			stagePermissions: [{}],
			stages: [
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
			],
			users: [
				{
					isSuperAdmin: false,
				},
				{
					isSuperAdmin: false,
				},
			],
			pubRelations: [
				{
					pubId: submissionPubId,
					relatedPubId: authorPubId,
				},
				{
					pubId: submissionPubId,
					relatedPubId: author2PubId,
				},
			],
		});

		rollback();
	});
});
