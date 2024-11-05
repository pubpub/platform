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

const { createForEachMockedTransaction } = await mockServerCode();

const { getTrx, rollback, commit } = createForEachMockedTransaction();

describe("seedCommunity", () => {
	test("Should be able to create some sort of community", async () => {
		const trx = getTrx();

		const seedCommunity = await import("./seedCommunity").then((mod) => mod.seedCommunity);
		const testUserId = crypto.randomUUID() as UsersId;

		const submissionPubId = crypto.randomUUID() as PubsId;
		const authorPubId = crypto.randomUUID() as PubsId;
		const author2PubId = crypto.randomUUID() as PubsId;

		const seededCommunity = await seedCommunity({
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
					Title: { isTitle: true },
					SubmissionAuthor: { isTitle: false },
				},
				Author: {
					Title: { isTitle: true },
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
								pub: {
									pubType: "Author",
									values: {
										Title: "De Heer Frederick III",
									},
								},
							},
							{
								value: 2,
								// also adds this pub as a child of the current pub
								alsoAsChild: true,
								pub: {
									pubType: "Author",
									values: {
										Title: "De Heer Frederick IV",
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

		expect(seededCommunity).toBeDefined();

		expect(seededCommunity.community, "community").toMatchObject({
			name: "test",
		});

		expect(seededCommunity.actions, "actions").toMatchObject([
			{
				action: "email",
				config: {
					body: "hello nerd",
					subject: "hello nerd",
				},
				name: "",
			},
		]);

		expect(seededCommunity.users, "users").toMatchObject({
			hih: {},
			test: {},
		});

		expect(seededCommunity.members, "members").toMatchObject([
			{
				role: "admin",
			},
			{
				role: "contributor",
			},
		]);

		expect(seededCommunity.pubFields, "pubFields").toMatchObject({
			Title: {
				isRelation: false,
				name: "Title",
				schemaName: "String",
			},
			SubmissionAuthor: {
				isRelation: true,
				name: "SubmissionAuthor",
				schemaName: "Number",
			},
		});

		expect(seededCommunity.pubTypes, "pubTypes").toMatchObject({
			Submission: {
				description: null,
				name: "Submission",
			},
			Author: {
				name: "Author",
			},
		});

		expect(seededCommunity.pubs, "pubs").toMatchObject([
			{ id: authorPubId },
			{
				id: submissionPubId,
				assigneeId: null,
				children: [
					{
						assigneeId: seededCommunity.users.test.id,
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
				stageId: seededCommunity.stages["Stage 1"].id,
				relatedPubs: [
					{
						value: 1,
						relatedPub: {
							pubTypeId: seededCommunity.pubTypes["Author"].id,
						},
					},

					{
						value: 2,
						relatedPub: {
							// it has a parent
							parentId: submissionPubId,
							pubTypeId: seededCommunity.pubTypes["Author"].id,
						},
					},
				],
			},
			{ id: author2PubId },
		]);

		expect(seededCommunity.stageConnections, "stageConnections").toMatchObject([]);

		expect(seededCommunity.stages, "stages").toMatchObject({
			"Stage 1": {
				members: ["test"],
				name: "Stage 1",
				order: "aa",
			},
			"Stage 2": {
				name: "Stage 2",
				order: "bb",
			},
		});

		expect(seededCommunity.forms, "forms").toMatchObject({
			"submission-form": {
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
		});

		rollback();
	});
});
