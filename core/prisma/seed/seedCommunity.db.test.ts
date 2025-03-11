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
					members: { hih: MemberRole.contributor },
					actions: {
						"1": {
							action: Action.email,
							config: {
								body: "hello nerd",
								subject: "hello nerd",
								recipientEmail: "all@pubpub.org",
							},
						},
					},
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
						SubmissionAuthor: [{ value: 0, relatedPubId: authorPubId }],
					},
					stage: "Stage 1",
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
				name: "1",
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
				valuesBlob: null,
				stageId: seededCommunity.stages["Stage 1"].id,
			},
			{ id: author2PubId },
		]);

		expect(seededCommunity.stageConnections, "stageConnections").toMatchObject([]);

		expect(seededCommunity.stages, "stages").toMatchObject({
			"Stage 1": {
				members: { hih: MemberRole.contributor },
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
						rank: "F",
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
						rank: "U",
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
						rank: "k",
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
