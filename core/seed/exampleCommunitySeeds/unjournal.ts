import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import type { CommunitiesId, PubFieldsId, PubTypesId, StagesId } from "db/public";
import { CoreSchemaType, MemberRole } from "db/public";
import { logger } from "logger";

import { db } from "~/kysely/database";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { env } from "../../lib/env/env.mjs";
import { FileUpload } from "../../lib/fields/fileUpload";

export default async function main(communityUUID: CommunitiesId) {
	logger.info("Creating Unjournal Community");
	await db
		.insertInto("communities")
		.values({
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: env.PUBPUB_URL + "/demo/unjournal.png",
		})
		.executeTakeFirst();

	const confidenceCommentsObject = {
		confidence2: {
			title: "Additional Comments",
			type: "string",
			minLength: 0,
		},
	};

	const HundredConfidenceDef = {
		$id: "unjournal:100confidence",
		title: "90% Confidence Interval Rating",
		description:
			"Provide three numbers: your rating, then the 90% confidence bounds for your rating. E.g. for a 50 rating, you might give bounds of 42 and 61.",
		type: "array",
		maxItems: 3,
		minItems: 3,
		default: [20, 30, 40],
		items: { type: "integer", minimum: 0, maximum: 100 },
	};

	const FiveConfidenceDef = {
		$id: "unjournal:5confidence",
		title: "90% Confidence Interval Rating",
		description:
			"Provide three numbers: your rating, then the 90% confidence bounds for your rating. E.g. for a 50 rating, you might give bounds of 42 and 61.",
		type: "array",
		maxItems: 3,
		minItems: 3,
		default: [2, 3, 4],
		items: { type: "number", minimum: 0, maximum: 5 },
	};

	const [
		metricsSchema,
		evaluatorSchema,
		predictionsSchema,
		confidentialCommentsSchema,
		surveySchema,
		feedbackSchema,
		anonymitySchema,
		evaluationSchema,
		fileUploadSchema,
	] = await db
		.insertInto("PubFieldSchema")
		.values([
			{
				name: "metrics",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:metrics",
					title: "Metrics",
					description:
						"Responses will be public. See <a href='https://globalimpact.gitbook.io/archived-the-unjournal-project/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#metrics-overall-assessment-categories'>here</a> for details on the categories.",
					type: "object",
					$defs: {
						confidence: HundredConfidenceDef,
					},
					properties: {
						metrics1: {
							title: "Overall assessment",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics2: {
							title: "Advancing knowledge and practice",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics3: {
							title: "Methods: Justification, reasonableness, validity, robustness",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics4: {
							title: "Logic & communication",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics5: {
							title: "Open, collaborative, replicable",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics6: {
							title: "Engaging with real-world, impact quantification; practice, realism, and relevance",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						metrics7: {
							title: "Relevance to global priorities",
							type: "object",
							properties: {
								confidence1: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
					},
				},
			},
			{
				name: "evaluator",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:evaluator",
					title: "Evaluator",
					type: "string",
					minLength: 36,
					maxLength: 36,
				},
			},
			{
				name: "predictions",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:predictions",
					title: "Prediction metric",
					description:
						"Responses will be public. See <a href='https://globalimpact.gitbook.io/archived-the-unjournal-project/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators#journal-prediction-metrics'>here</a> for details on the metrics.",
					type: "object",
					$defs: {
						confidence: FiveConfidenceDef,
					},
					properties: {
						qualityJournal: {
							title: "What 'quality journal' do you expect this work will this be published in?",
							type: "object",
							properties: {
								confidence: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
						qualityLevel: {
							title: "Overall assessment on 'scale of journals'; i.e., quality-level of  journal it should be published in.",
							type: "object",
							properties: {
								confidence: { $ref: "#/$defs/confidence" },
								...confidenceCommentsObject,
							},
						},
					},
				},
			},
			{
				name: "confidential-comments",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:confidential-comments",
					title: "Please write confidential comments here",
					description:
						"Response will not be public or seen by authors, please use this section only for comments that are personal/sensitivity in nature and place most of your evaluation in the public section).",
					type: "string",
				},
			},
			{
				name: "survey",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:survey",
					title: "Survey questions",
					description: "Responses will be public unless you ask us to keep them private.",
					type: "object",
					properties: {
						field: {
							title: "How long have you been in this field?",
							type: "string",
						},
						papers: {
							title: "How many proposals, papers, and projects have you evaluated/reviewed (for journals, grants, or other peer-review)?",
							type: "string",
						},
					},
				},
			},
			{
				name: "feedback",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:feedback",
					title: "Feedback",
					description: "Responses will not be public or seen by authors.",
					type: "object",
					properties: {
						rating: {
							title: "How would you rate this template and process?",
							type: "string",
						},
						suggestions: {
							title: "Do you have any suggestions or questions about this process or the Unjournal? (We will try to respond, and incorporate your suggestions.)",
							type: "string",
						},
						time: {
							title: "Approximately how long did you spend completing this evaluation?",
							type: "string",
						},
						revision: {
							title: "Would you be willing to consider evaluating a revised version of this work?",
							type: "boolean",
							default: false,
						},
					},
				},
			},
			{
				name: "anonymity",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:anonymity",
					title: "Would you like to publicly sign your review?",
					description:
						"If no, the public sections of your review will be published anonymously.",
					type: "boolean",
					default: false,
				},
			},
			{
				name: "uploadFile",
				namespace: "unjournal",
				schema: FileUpload,
			},
			{
				name: "evaluation",
				namespace: "unjournal",
				schema: {
					$id: "unjournal:evaluation",
					title: "Please link to or upload your evaluation here",
					description:
						"Remember that your responses will be made public. Please consult <a href='https://globalimpact.gitbook.io/archived-the-unjournal-project/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators'>our criteria</a>. We are essentially asking for a 'standard high-quality referee report' here, with some specific considerations (mentioned in the above link). We welcome detail, elaboration, and technical discussion. If you prefer to link or submit your evaluation content in a different format, please link it here or send it to the corresponding/managing editor. Length and time spent: This is of course, up to you.  The Econometrics society recommends a 2-3 page referee report. In a recent survey (Charness et al, 2022), economists report spending (median and mean) about one day per report, with substantial shares reporting 'half a day' and 'two days'. We expect that that reviewers tend to spend more time on papers for high-status journals, and when reviewing work closely tied to their own agenda.",
					type: "string",
				},
			},
		])
		.returningAll()
		.execute();

	const fieldIds = [...Array(17)].map(() => uuidv4() as PubFieldsId);

	const pubFields = await db
		.insertInto("pub_fields")
		.values([
			{
				id: fieldIds[0],
				name: "Title",
				slug: "unjournal:title",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[1],
				name: "Description",
				slug: "unjournal:description",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[2],
				name: "Manager's Notes",
				slug: "unjournal:managers-notes",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[3],
				name: "Anonymity",
				pubFieldSchemaId: anonymitySchema.id,
				slug: "unjournal:anonymity",
				communityId: communityUUID,
				schemaName: CoreSchemaType.Boolean,
			},
			{
				id: fieldIds[4],
				name: "Please enter your 'salted hashtag' here if you know it. Otherwise please enter an anonymous psuedonym here",
				slug: "unjournal:hashtag",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[5],
				name: "Evaluation",
				pubFieldSchemaId: evaluationSchema.id,
				slug: "unjournal:evaluation",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[15],
				name: "File Upload",
				pubFieldSchemaId: fileUploadSchema.id,
				slug: "unjournal:fileUpload",
				communityId: communityUUID,
				schemaName: CoreSchemaType.FileUpload,
			},
			{
				id: fieldIds[6],
				name: "Evaluated Paper",
				slug: "unjournal:evaluated-paper",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[7],
				name: "Tags",
				slug: "unjournal:tags",
				communityId: communityUUID,
				schemaName: CoreSchemaType.StringArray,
			},
			{
				id: fieldIds[8],
				name: "DOI",
				slug: "unjournal:doi",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[9],
				name: "Metrics",
				pubFieldSchemaId: metricsSchema.id,
				slug: "unjournal:metrics",
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[10],
				name: "Predictions",
				slug: "unjournal:predictions",
				pubFieldSchemaId: predictionsSchema.id,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[11],
				name: "Confidential Comments",
				slug: "unjournal:confidential-comments",
				pubFieldSchemaId: confidentialCommentsSchema.id,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[12],
				name: "Survey Questions",
				slug: "unjournal:survey",
				pubFieldSchemaId: surveySchema.id,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[13],
				name: "Feedback",
				slug: "unjournal:feedback",
				pubFieldSchemaId: feedbackSchema.id,
				communityId: communityUUID,
				schemaName: CoreSchemaType.String,
			},
			{
				id: fieldIds[14],
				name: "Submission Evaluator",
				pubFieldSchemaId: evaluatorSchema.id,
				slug: "unjournal:evaluator",
				communityId: communityUUID,
				schemaName: CoreSchemaType.MemberId,
			},
			{
				id: fieldIds[16],
				name: "URL",
				slug: "unjournal:url",
				communityId: communityUUID,
				schemaName: CoreSchemaType.URL,
			},
		])
		.returningAll()
		.execute();

	const submissionTypeId = "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225" as PubTypesId;

	const evaluationSummaryTypeId = "2981e8ca-dabe-416f-bce0-fcc418036529" as PubTypesId;

	const authorResponseTypeId = "d2ad1f23-f310-4974-8d45-3c55a3dc0638" as PubTypesId;

	const evaluationTypeId = "81d18691-3ac4-42c1-b55b-d3b2c065b9ad" as PubTypesId;

	await db
		.insertInto("pub_types")
		.values([
			{
				id: submissionTypeId,
				name: "Submission",
				communityId: communityUUID,
			},
			{
				id: evaluationSummaryTypeId,
				name: "Evaluation Summary",
				communityId: communityUUID,
			},
			{
				id: authorResponseTypeId,
				name: "Author Response",
				communityId: communityUUID,
			},
			{
				id: evaluationTypeId,
				name: "Evaluation",
				communityId: communityUUID,
			},
		])
		.execute();

	await db
		.insertInto("_PubFieldToPubType")
		.values([
			...[
				// title
				{ A: fieldIds[0] as PubFieldsId, B: submissionTypeId as PubTypesId, isTitle: true },
				// description, manager's notes, doi, url
				...[fieldIds[1], fieldIds[2], fieldIds[8], fieldIds[16]].map((fieldId) => {
					return {
						A: fieldId as PubFieldsId,
						B: submissionTypeId as PubTypesId,
						isTitle: false,
					};
				}),
			],
			...[
				// title
				{
					A: fieldIds[0] as PubFieldsId,
					B: evaluationSummaryTypeId as PubTypesId,
					isTitle: true,
				},
				// description, manager's notes
				...[fieldIds[1], fieldIds[2]].map((fieldId) => {
					return {
						A: fieldId as PubFieldsId,
						B: evaluationSummaryTypeId as PubTypesId,
						isTitle: false,
					};
				}),
			],
			...[
				// title
				{
					A: fieldIds[0] as PubFieldsId,
					B: authorResponseTypeId as PubTypesId,
					isTitle: true,
				},
				// description
				{
					A: fieldIds[1] as PubFieldsId,
					B: authorResponseTypeId as PubTypesId,
					isTitle: false,
				},
			],
			...[
				// title
				{ A: fieldIds[0] as PubFieldsId, B: evaluationTypeId as PubTypesId, isTitle: true },
				// description, manager's notes
				...[
					fieldIds[3],
					fieldIds[4],
					fieldIds[5],
					fieldIds[9],
					fieldIds[10],
					fieldIds[11],
					fieldIds[12],
					fieldIds[13],
					fieldIds[14],
					fieldIds[15],
				].map((fieldId) => {
					return {
						A: fieldId as PubFieldsId,
						B: evaluationTypeId as PubTypesId,
						isTitle: false,
					};
				}),
			],
		])
		.execute();

	const [user1, user2] = await db
		.insertInto("users")
		.values([
			{
				slug: faker.lorem.slug(),
				email: faker.internet.email(),
				firstName: "David",
				lastName: faker.person.lastName(),
				avatar: faker.image.avatar(),
			},
			{
				slug: faker.lorem.slug(),
				email: faker.internet.email(),
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				avatar: faker.image.avatar(),
			},
		])
		.returningAll()
		.execute();

	await db
		.insertInto("community_memberships")
		.values([
			{
				userId: user1.id,
				communityId: communityUUID,
				role: MemberRole.admin,
			},
		])
		.execute();

	await db
		.insertInto("community_memberships")
		.values([
			{
				userId: user2.id,
				communityId: communityUUID,
				role: MemberRole.editor,
			},
		])
		.execute();

	const stageIds = [...Array(8)].map((x) => uuidv4() as StagesId);

	await db
		.insertInto("stages")
		.values([
			{
				id: stageIds[0],
				communityId: communityUUID,
				name: "Submitted",
				order: "aa",
			},
			{
				id: stageIds[1],
				communityId: communityUUID,
				name: "Ask Author for Consent",
				order: "bb",
			},
			{
				id: stageIds[2],
				communityId: communityUUID,
				name: "To Evaluate",
				order: "cc",
			},
			{
				id: stageIds[3],
				communityId: communityUUID,
				name: "Under Evaluation",
				order: "dd",
			},
			{
				id: stageIds[4],
				communityId: communityUUID,
				name: "In Production",
				order: "ff",
			},
			{
				id: stageIds[5],
				communityId: communityUUID,
				name: "Published",
				order: "gg",
			},
			{
				id: stageIds[6],
				communityId: communityUUID,
				name: "Shelved",
				order: "hh",
			},
		])
		.execute();

	//  Submitted can be moved to: Consent, To Evaluate, Under Evaluation, Shelved
	await db
		.insertInto("move_constraint")
		.values([
			{
				stageId: stageIds[0],
				destinationId: stageIds[1],
			},
		])
		.execute();

	// Consent --> To Evaluate, Under Evaluation, Shelved
	await db
		.insertInto("move_constraint")
		.values([
			{
				stageId: stageIds[1],
				destinationId: stageIds[2],
			},
		])
		.execute();

	// To Evaluate --> Under Evaluation, Shelved
	await db
		.insertInto("move_constraint")
		.values([
			{
				stageId: stageIds[2],
				destinationId: stageIds[3],
			},
		])
		.execute();

	// Under Evaluation --> In Production, Shelved
	await db
		.insertInto("move_constraint")
		.values([
			{
				stageId: stageIds[3],
				destinationId: stageIds[4],
			},
		])
		.execute();

	// Production --> Published, Shelved
	await db
		.insertInto("move_constraint")
		.values([
			{
				stageId: stageIds[4],
				destinationId: stageIds[5],
			},
		])
		.execute();

	await db
		.with("new_pubs", (db) =>
			db
				.insertInto("pubs")
				.values({
					communityId: communityUUID as CommunitiesId,
					pubTypeId: submissionTypeId as PubTypesId,
				})
				.returning("id")
		)
		.with("pubs_in_stages", (db) =>
			db.insertInto("PubsInStages").values((eb) => [
				{
					pubId: eb.selectFrom("new_pubs").select("id"),
					stageId: stageIds[3] as StagesId,
				},
			])
		)
		.insertInto("pub_values")
		.values((eb) => [
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: fieldIds[0] as PubFieldsId, // title
				value: '"It Aint Ease Bein Cheese"',
				lastModifiedBy: createLastModifiedBy("system"),
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: fieldIds[1] as PubFieldsId, // description
				value: '"# Abstract"',
				lastModifiedBy: createLastModifiedBy("system"),
			},
		])
		.execute();

	logger.info("Unjournal Community created");
}
