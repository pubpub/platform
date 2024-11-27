import type { PrismaClient } from "@prisma/client";

import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

import type { CommunitiesId, PubFieldsId, PubTypesId, StagesId } from "db/public";
import { CoreSchemaType } from "db/public";

import { db } from "~/kysely/database";
import { env } from "../../lib/env/env.mjs";
import { FileUpload } from "../../lib/fields/fileUpload";

export const unJournalId = "03e7a5fd-bdca-4682-9221-3a69992c1f3b";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: env.PUBPUB_URL + "/demo/unjournal.png",
		},
	});

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

	const metricsSchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const evaluator = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const predictionsSchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const confidentialCommentsSchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const surveySchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const feedbackSchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const anonymitySchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const fileUploadSchema = await prisma.pubFieldSchema.create({
		data: {
			name: "uploadFile",
			namespace: "unjournal",
			schema: FileUpload,
		},
	});

	const evaluationSchema = await prisma.pubFieldSchema.create({
		data: {
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
	});

	const fieldIds = [...Array(17)].map(() => uuidv4());

	await prisma.pubField.createMany({
		data: [
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
				pubFieldSchemaId: evaluator.id,
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
		],
	});

	const submissionTypeId = "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225";
	await prisma.pubType.create({
		data: {
			id: submissionTypeId,
			name: "Submission",
			communityId: communityUUID,
		},
	});
	await db
		.insertInto("_PubFieldToPubType")
		.values([
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
		])
		.execute();

	const evaluationSummaryTypeId = "2981e8ca-dabe-416f-bce0-fcc418036529";
	await prisma.pubType.create({
		data: {
			id: evaluationSummaryTypeId,
			name: "Evaluation Summary",
			communityId: communityUUID,
		},
	});
	await db
		.insertInto("_PubFieldToPubType")
		.values([
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
		])
		.execute();

	const authorResponseTypeId = "d2ad1f23-f310-4974-8d45-3c55a3dc0638";
	await prisma.pubType.create({
		data: {
			id: authorResponseTypeId,
			name: "Author Response",
			communityId: communityUUID,
		},
	});
	await db
		.insertInto("_PubFieldToPubType")
		.values([
			// title
			{ A: fieldIds[0] as PubFieldsId, B: authorResponseTypeId as PubTypesId, isTitle: true },
			// description
			{
				A: fieldIds[1] as PubFieldsId,
				B: authorResponseTypeId as PubTypesId,
				isTitle: false,
			},
		])
		.execute();

	const evaluationTypeId = "81d18691-3ac4-42c1-b55b-d3b2c065b9ad";
	await prisma.pubType.create({
		data: {
			id: evaluationTypeId,
			name: "Evaluation",
			communityId: communityUUID,
		},
	});
	await db
		.insertInto("_PubFieldToPubType")
		.values([
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
		])
		.execute();

	const user1 = await prisma.user.create({
		data: {
			slug: faker.lorem.slug(),
			email: faker.internet.email(),
			firstName: "David",
			lastName: faker.person.lastName(),
			avatar: faker.image.avatar(),
		},
	});

	const user2 = await prisma.user.create({
		data: {
			slug: faker.lorem.slug(),
			email: faker.internet.email(),
			firstName: faker.person.firstName(),
			lastName: faker.person.lastName(),
			avatar: faker.image.avatar(),
		},
	});

	const member = await prisma.communityMembership.create({
		data: {
			userId: user1.id,
			communityId: communityUUID,
			role: "admin",
		},
	});

	const memberGroup = await prisma.memberGroup.create({
		data: {
			communityId: communityUUID,
			users: {
				connect: [{ id: user2.id }],
			},
		},
	});

	const stageIds = [...Array(8)].map((x) => uuidv4());
	await prisma.stage.createMany({
		data: [
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
		],
	});

	//  Submitted can be moved to: Consent, To Evaluate, Under Evaluation, Shelved
	await prisma.stage.update({
		where: { id: stageIds[0] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[1] }],
				},
			},
		},
	});

	// Consent --> To Evaluate, Under Evaluation, Shelved
	await prisma.stage.update({
		where: { id: stageIds[1] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[2] }],
				},
			},
		},
	});

	// To Evaluate --> Under Evaluation, Shelved
	await prisma.stage.update({
		where: { id: stageIds[2] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[3] }],
				},
			},
		},
	});

	// Under Evaluation --> In Production, Shelved
	await prisma.stage.update({
		where: { id: stageIds[3] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[4] }],
				},
			},
		},
	});

	// Production --> Published, Shelved
	await prisma.stage.update({
		where: { id: stageIds[4] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[5] }],
				},
			},
		},
	});

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
			},
			{
				pubId: eb.selectFrom("new_pubs").select("new_pubs.id"),
				fieldId: fieldIds[1] as PubFieldsId, // description
				value: '"# Abstract"',
			},
		])
		.execute();
	// await prisma.pub.update({
	// 	where: { id: submission.id },
	// 	data: {
	// 		stages: { connect: { id: stageIds[0] } },
	// 	},
	// });
	// await prisma.pub.update({
	// 	where: { id: toAskForConsent.id },
	// 	data: {
	// 		stages: { connect: { id: stageIds[1] } },
	// 		permissions: { create: { memberGroupId: memberGroup.id } },
	// 	},
	// });
	// await prisma.pub.update({
	// 	where: { id: toEvaluate.id },
	// 	data: { stages: { connect: { id: stageIds[2] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: evaluating1.id },
	// 	data: { stages: { connect: { id: stageIds[3] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: evaluating2.id },
	// 	data: { stages: { connect: { id: stageIds[3] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: evaluationSummary.id },
	// 	data: { stages: { connect: { id: stageIds[4] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: authorsResponse.id },
	// 	data: { stages: { connect: { id: stageIds[4] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: evaluation1.id },
	// 	data: { stages: { connect: { id: stageIds[5] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: evaluation2.id },
	// 	data: { stages: { connect: { id: stageIds[5] } } },
	// });
	// await prisma.pub.update({
	// 	where: { id: authorRejection.id },
	// 	data: { stages: { connect: { id: stageIds[6] } } },
	// });

	const submissionsIntegrationUrl =
		env.NODE_ENV === "production"
			? "https://integration-submissions.onrender.com"
			: "http://localhost:3002";
	const submissionsIntegration = await prisma.integration.create({
		data: {
			name: "Submission Manager",
			actions: [
				{
					name: "submit",
					text: "Submit Pub",
					href: `${submissionsIntegrationUrl}/actions/submit`,
					kind: "stage",
				},
			],
			settingsUrl: `${submissionsIntegrationUrl}/configure`,
		},
	});

	const evaluationsIntegrationUrl =
		env.NODE_ENV === "production"
			? "https://integration-evaluations.onrender.com"
			: "http://localhost:3001";
	const evaluationsIntegration = await prisma.integration.create({
		data: {
			name: "Evaluation Manager",
			actions: [
				{
					name: "manage",
					text: "Manage Evaluation",
					href: `${evaluationsIntegrationUrl}/actions/manage`,
				},
				{
					name: "respond",
					href: `${evaluationsIntegrationUrl}/actions/respond`,
				},
				{
					name: "evaluate",
					href: `${evaluationsIntegrationUrl}/actions/evaluate`,
				},
			],
			settingsUrl: `${evaluationsIntegrationUrl}/configure`,
		},
	});

	const evaluationManagerName =
		"{{pubs.submission.assignee?.firstName??users.invitor.firstName}} {{pubs.submission.assignee?.lastName??users.invitor.lastName}}";
	const evaluationManagerEmail = "{{pubs.submission.assignee?.email??users.invitor.email}}";

	const defaultEvaluationEmailSubject = `${evaluationManagerName} invited you to evaluate {{pubs.submission.values["unjournal:title"]}} for The Unjournal`;

	const defaultEvaluationEmailBody = `<p>{{extra.disclaimer}}</p><hr/>
<p>Hi {{user.firstName}} {{user.lastName}},</p>
<p>I'm ${evaluationManagerName} from The Unjournal. (See our 'in a nutshell' <a href="https://effective-giving-marketing.gitbook.io/the-unjournal-project-and-communication-space/readme-1">HERE</a>.) I'm writing to invite you to evaluate <a href="{{pubs.submission.values["unjournal:url"]}}">"{{pubs.submission.values["unjournal:title"]}}"</a>. The abstract is copied below, and the most recent version is linked <a href="{{pubs.submission.values["unjournal:url"]}}">here</a>.</p>	
<p>The evaluation would be publicly posted at <a href="https://unjournal.pubpub.org">unjournal.pubpub.org</a> (where you can see our output). It will be given a DOI and submitted to research archives such as Google Scholar. You can choose whether to remain anonymous or have the evaluation listed under your name. As a sign that we value this work, we offer a $400 honorarium for on-time evaluations, and we are also setting aside $150 per evaluation for incentives and prizes. See <a href="https://globalimpact.gitbook.io/the-unjournal-project-and-communication-space/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators">here</a> for our guidelines on what we ask evaluators to do.</p>
<p>If you're interested, please 'accept' the invitation at the link below, and I'll share with you the (simple) interface for entering your evaluation and rating, as well as any specific considerations relevant to this paper. If you are too busy, please click 'decline' (and we welcome any suggestions you might have for other evaluators). If you are not sure, or if you have any questions about this, please reach out to me at <a href="mailto:${evaluationManagerEmail}">${evaluationManagerEmail}</a> or select the 'more information' link.</p>
<p>{{extra.accept_link}} | {{extra.decline_link}} | {{extra.info_link}}</p>
<p>Thanks and best wishes,</p>
<p>${evaluationManagerName}</p>
<p><a href="https://unjournal.org">Unjournal.org</a></p>	
<p><a href="{{pubs.submission.values["unjournal:url"]}}">"{{pubs.submission.values["unjournal:title"]}}"</a></p>
<p>{{pubs.submission.values["unjournal:description"]??""}}</p>`;

	const integrationInstances = [
		{
			id: "af837db6-9a1f-4b38-878f-f84fde8a0b50",
			name: "Unjournal Submissions Manager",
			integrationId: submissionsIntegration.id,
			stageId: stageIds[0],
			config: {
				pubTypeId: submissionTypeId,
			},
		},
		{
			id: "d6177ad1-ae7d-43b7-9c12-dcd31a38f255",
			name: "Unjournal Evaluation Manager",
			integrationId: evaluationsIntegration.id,
			stageId: stageIds[3],
			config: {
				pubTypeId: evaluationTypeId,
				emailTemplate: {
					subject: defaultEvaluationEmailSubject,
					message: defaultEvaluationEmailBody,
				},
				titleFieldSlug: "unjournal:title",
				evaluatorFieldSlug: "unjournal:evaluator",
				deadlineLength: 35,
				deadlineUnit: "days",
			},
		},
	];

	Promise.all(
		integrationInstances.map((instance) => {
			return prisma.integrationInstance.create({
				data: {
					communityId: communityUUID,
					...instance,
				},
			});
		})
	);
}
