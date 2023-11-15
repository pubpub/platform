import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

export const unJournalId = "03e7a5fd-bdca-4682-9221-3a69992c1f3b";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: "/demo/unjournal.png",
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

	const evaluationSchema = await prisma.pubFieldSchema.create({
		data: {
			name: "evaluation",
			namespace: "unjournal",
			schema: {
				$id: "unjournal:evaluation",
				title: "Please write your evaluation here",
				description:
					"Remember that your responses will be made public. Please consult <a href='https://globalimpact.gitbook.io/archived-the-unjournal-project/policies-projects-evaluation-workflow/evaluation/guidelines-for-evaluators'>our criteria</a>. We are essentially asking for a 'standard high-quality referee report' here, with some specific considerations (mentioned in the above link). We welcome detail, elaboration, and technical discussion. If you prefer to link or submit your evaluation content in a different format, please link it here or send it to the corresponding/managing editor. Length and time spent: This is of course, up to you.  The Econometrics society recommends a 2-3 page referee report. In a recent survey (Charness et al, 2022), economists report spending (median and mean) about one day per report, with substantial shares reporting ‘half a day’ and ‘two days’. We expect that that reviewers tend to spend more time on papers for high-status journals, and when reviewing work closely tied to their own agenda.",
				type: "string",
			},
		},
	});

	const fieldIds = [...Array(15)].map(() => uuidv4());

	await prisma.pubField.createMany({
		data: [
			{ id: fieldIds[0], name: "Title", slug: "unjournal:title" },
			{ id: fieldIds[1], name: "Description", slug: "unjournal:description" },
			{ id: fieldIds[2], name: "Manager's Notes", slug: "unjournal:managers-notes" },
			{
				id: fieldIds[3],
				name: "Anonymity",
				pubFieldSchemaId: anonymitySchema.id,
				slug: "unjournal:anonymity",
			},
			{
				id: fieldIds[4],
				name: "Please enter your 'salted hashtag' here if you know it. Otherwise please enter an anonymous psuedonym here",
				slug: "unjournal:hashtag",
			},
			{
				id: fieldIds[5],
				name: "Evaluation",
				pubFieldSchemaId: evaluationSchema.id,
				slug: "unjournal:evaluation",
			},
			{ id: fieldIds[6], name: "Evaluated Paper", slug: "unjournal:evaluated-paper" },
			{ id: fieldIds[7], name: "Tags", slug: "unjournal:tags" },
			{ id: fieldIds[8], name: "DOI", slug: "unjournal:doi" },
			{
				id: fieldIds[9],
				name: "Metrics",
				pubFieldSchemaId: metricsSchema.id,
				slug: "unjournal:metrics",
			},
			{
				id: fieldIds[10],
				name: "Predictions",
				slug: "unjournal:predictions",
				pubFieldSchemaId: predictionsSchema.id,
			},
			{
				id: fieldIds[11],
				name: "Confidential Comments",
				slug: "unjournal:confidential-comments",
				pubFieldSchemaId: confidentialCommentsSchema.id,
			},
			{
				id: fieldIds[12],
				name: "Survey Questions",
				slug: "unjournal:survey",
				pubFieldSchemaId: surveySchema.id,
			},
			{
				id: fieldIds[13],
				name: "Feedback",
				slug: "unjournal:feedback",
				pubFieldSchemaId: feedbackSchema.id,
			},
			{
				id: fieldIds[14],
				name: "Submission Evaluator",
				pubFieldSchemaId: evaluator.id,
				slug: "unjournal:evaluator",
			},
		],
	});

	const submissionTypeId = "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225";
	await prisma.pubType.create({
		data: {
			id: submissionTypeId,
			name: "Submission",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[8] }],
			},
		},
	});
	const evaluationSummaryTypeId = "2981e8ca-dabe-416f-bce0-fcc418036529";
	await prisma.pubType.create({
		data: {
			id: evaluationSummaryTypeId,
			name: "Evaluation Summary",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[2] }],
			},
		},
	});

	const authorResponseTypeId = "d2ad1f23-f310-4974-8d45-3c55a3dc0638";
	await prisma.pubType.create({
		data: {
			id: authorResponseTypeId,
			name: "Author Response",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }],
			},
		},
	});

	const evaluationTypeId = "81d18691-3ac4-42c1-b55b-d3b2c065b9ad";
	await prisma.pubType.create({
		data: {
			id: evaluationTypeId,
			name: "Evaluation",
			communityId: communityUUID,
			fields: {
				connect: [
					{ id: fieldIds[0] },
					{ id: fieldIds[3] },
					{ id: fieldIds[4] },
					{ id: fieldIds[5] },
					{ id: fieldIds[9] },
					{ id: fieldIds[10] },
					{ id: fieldIds[11] },
					{ id: fieldIds[12] },
					{ id: fieldIds[13] },
					{ id: fieldIds[14] }, // evaluator
				],
			},
		},
	});

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

	const member = await prisma.member.create({
		data: {
			userId: user1.id,
			communityId: communityUUID,
			canAdmin: true,
		},
	});

	const memberGroup = await prisma.memberGroup.create({
		data: {
			canAdmin: false,
			communityId: communityUUID,
			users: {
				connect: [{ id: user2.id }],
			},
		},
	});

	const stageIds = [...Array(7)].map((x) => uuidv4());
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

	await prisma.permission.create({
		data: {
			member: {
				connect: { id: member.id },
			},
			stages: {
				connect: [{ id: stageIds[0] }],
			},
			// pubs: {
			// 	connect: [{ id: submission.id }],
			// },
		},
	});

	await prisma.permission.create({
		data: {
			memberGroup: {
				connect: { id: memberGroup.id },
			},
			stages: {
				connect: [{ id: stageIds[0] }],
			},
			// pubs: {
			// 	connect: [{ id: submission.id }],
			// },
		},
	});

	await prisma.permission.create({
		data: {
			memberGroup: {
				connect: { id: memberGroup.id },
			},
			stages: {
				connect: [{ id: stageIds[1] }],
			},
		},
	});

	await prisma.permission.create({
		data: {
			memberGroup: {
				connect: { id: memberGroup.id },
			},
			stages: {
				connect: [{ id: stageIds[2] }],
			},
		},
	});

	await prisma.permission.create({
		data: {
			member: {
				connect: { id: member.id },
			},
			stages: {
				connect: [{ id: stageIds[3] }],
			},
		},
	});

	//  Submitted can be moved to: Consent, To Evaluate, Under Evaluation, Shelved
	await prisma.stage.update({
		where: { id: stageIds[0] },
		data: {
			moveConstraints: {
				createMany: {
					data: [
						{ destinationId: stageIds[1] },
						{ destinationId: stageIds[2] },
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[6] },
					],
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
					data: [
						{ destinationId: stageIds[2] },
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[6] },
					],
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
					data: [{ destinationId: stageIds[3] }, { destinationId: stageIds[6] }],
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
					data: [{ destinationId: stageIds[4] }, { destinationId: stageIds[6] }],
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
					data: [{ destinationId: stageIds[5] }, { destinationId: stageIds[6] }],
				},
			},
		},
	});

	// Published --> Production, Shelved
	await prisma.stage.update({
		where: { id: stageIds[5] },
		data: {
			moveConstraints: {
				createMany: {
					data: [{ destinationId: stageIds[6] }],
				},
			},
		},
	});

	// Shelved --> No Constraints?
	/* await prisma.stage.update({
		where: { id: stageIds[6] },
		data: {
			moveConstraints: {
				createMany: {
					data: [],
				},
			},
		},
	});*/

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
		process.env.NODE_ENV === "production"
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
		process.env.NODE_ENV === "production"
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
					name: "evaluate",
					href: `${evaluationsIntegrationUrl}/actions/evaluate`,
				},
			],
			settingsUrl: `${evaluationsIntegrationUrl}/configure`,
		},
	});

	const integrationInstances = [
		{
			id: "af837db6-9a1f-4b38-878f-f84fde8a0b50",
			name: "Unjournal Submissions Manager",
			integrationId: submissionsIntegration.id,
			stageId: stageIds[0],
		},
		{
			id: "d6177ad1-ae7d-43b7-9c12-dcd31a38f255",
			name: "Unjournal Evaluation Manager",
			integrationId: evaluationsIntegration.id,
			stageId: stageIds[3],
			config: {
				pubTypeId: evaluationTypeId,
				template: {
					subject: "You've been invited to review a submission on PubPub",
					message: `Please reach out if you have any questions.`,
				},
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

	// const pubIds = [...Array(7)].map((x) => uuidv4());
	// const submissionToEvaluate = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: submissionTypeId,
	// 		communityId: communityUUID,
	// 		stages: { connect: { id: stageIds[3] } },

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: "When Celebrities Speak: A Nationwide Twitter Experiment Promoting Vaccination In Indonesia",
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: "Celebrity endorsements are often sought to influence public opinion. We ask whether celebrity endorsement per se has an effect beyond the fact that their statements are seen by many, and whether on net their statements actually lead people to change their beliefs. To do so, we conducted a nationwide Twitter experiment in Indonesia with 46 high-profile celebrities and organizations, with a total of 7.8 million followers, who agreed to let us randomly tweet or retweet content promoting immunization from their accounts. Our design exploits the structure of what information is passed on along a retweet chain on Twitter to parse reach versus endorsement effects. Endorsements matter: tweets that users can identify as being originated by a celebrity are far more likely to be liked or retweeted by users than similar tweets seen by the same users but without the celebrities' imprimatur. By contrast, explicitly citing sources in the tweets actually reduces diffusion. By randomizing which celebrities tweeted when, we find suggestive evidence that overall exposure to the campaign may influence beliefs about vaccination and knowledge of immunization-seeking behavior by one's network. Taken together, the findings suggest an important role for celebrity endorsement.",
	// 					},
	// 					{
	// 						fieldId: fieldIds[8],
	// 						value: "10.3386/w25589",
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });
}
