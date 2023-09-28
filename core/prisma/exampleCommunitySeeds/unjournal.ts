import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: "/demo/unjournal.png",
		},
	});

	const confidenceObject = {
		rating: {
			title: "Rating",
			type: "number",
			minimum: 0,
			maximum: 100,
			default: 0,
		},
		confidence: {
			title: "90% Confidence Interval",
			description: "E.g. for a 50 rating, you might give a CI of 42, 61",
			type: "object",
			properties: {
				low: {
					title: "Low",
					type: "number",
					minimum: 0,
					maximum: 100,
					default: 0,
				},
				high: {
					title: "High",
					type: "number",
					minimum: 0,
					maximum: 100,
					default: 0,
				},
				comments: {
					title: "Additional Comments",
					type: "string",
					minLength: 0,
				},
			},
		},
	};

	const metricsSchema = await prisma.pubFieldSchema.create({
		data: {
			name: "metrics",
			namespace: "unjournal",
			schema: {
				$id: "unjournal:metrics",
				title: "Metrics and Predictions",
				description: "Responses will be public. See here for details on the categories.",
				type: "object",
				properties: {
					assessment: {
						title: "Overall assessment",
						type: "object",
						properties: confidenceObject,
					},
					advancing: {
						title: "Advancing knowledge and practice",
						type: "object",
						properties: confidenceObject,
					},
					methods: {
						title: "Methods: Justification, reasonableness, validity, robustness",
						type: "object",
						properties: confidenceObject,
					},
					logic: {
						title: "Logic & Communication",
						type: "object",
						properties: confidenceObject,
					},
					open: {
						title: "Open, collaborative, replicable",
						type: "object",
						properties: confidenceObject,
					},
					real: {
						title: "Engaging with real-world, impact quantification; practice, realism, and relevance",
						type: "object",
						properties: confidenceObject,
					},
					relevance: {
						title: "Engaging with real-world, impact quantification; practice, realism, and relevance",
						type: "object",
						properties: confidenceObject,
					},
				},
			},
		},
	});

	const fieldIds = [...Array(12)].map(() => uuidv4());

	await prisma.pubField.createMany({
		data: [
			{ id: fieldIds[0], name: "Title", slug: "unjournal:title" },
			{ id: fieldIds[1], name: "Description", slug: "unjournal:description" },
			{ id: fieldIds[2], name: "Manager's Notes", slug: "unjournal:managers-notes" },
			{ id: fieldIds[3], name: "Anonymity", slug: "unjournal:anonymity" },
			{ id: fieldIds[4], name: "Metrics", slug: "unjournal:metrics" },
			{ id: fieldIds[5], name: "Content", slug: "unjournal:content" },
			{ id: fieldIds[6], name: "Evaluated Paper", slug: "unjournal:evaluated-paper" },
			{ id: fieldIds[7], name: "Tags", slug: "unjournal:tags" },
			{ id: fieldIds[8], name: "DOI", slug: "unjournal:doi" },
			{
				id: fieldIds[9],
				name: "Metrics and Predictions",
				pubFieldSchemaId: metricsSchema.id,
				slug: "unjournal:metrics-predictions",
			},
			{
				id: fieldIds[10],
				name: "Survey Questions",
				slug: "unjournal:survey-questions",
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
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[9] }],
			},
		},
	});

	const user1 = await prisma.user.create({
		data: {
			slug: faker.lorem.slug(),
			email: faker.internet.email(),
			name: faker.person.fullName(),
			avatar: faker.image.avatar(),
		},
	});

	const user2 = await prisma.user.create({
		data: {
			slug: faker.lorem.slug(),
			email: faker.internet.email(),
			name: faker.person.fullName(),
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

	const submission = await prisma.pub.create({
		data: {
			pubTypeId: submissionTypeId,
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Advance Market Commitments: Insights from Theory and Experience",
						},
						{
							fieldId: fieldIds[1],
							value: `Ten years ago, donors committed $1.5 billion to a pilot Advance Market Commitment (AMC) to help purchase pneumococcal vaccine for low-income countries. The AMC aimed to encourage the development of such vaccines, ensure distribution to children in low-income countries, and pilot the AMC mechanism for possible future use. Three vaccines have been developed and more than 150 million children immunized, saving an estimated 700,000 lives. This paper reviews the economic logic behind AMCs, the experience with the pilot, and key issues for future AMCs.`,
						},
					],
				},
			},
		},
	});

	const toAskForConsent = await prisma.pub.create({
		data: {
			pubTypeId: submissionTypeId,
			communityId: communityUUID,

			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "The Governance of Non-Profits and their Social Impact: Evidence from a Randomized Program in Healthcare in the Democratic Republic of Congo",
						},
						{
							fieldId: fieldIds[1],
							value: "Substantial funding is provided to the healthcare systems of low-income countries. However, an important challenge is to ensure that this funding be used efficiently. This challenge is complicated by the fact that a large share of healthcare services in low-income countries is provided by non-profit health centers that often lack i) effective governance structures and ii) organizational know-how and adequate training. In this paper, we argue that the bundling of performance-based incentives with auditing and feedback (A&F) is a potential way to overcome these obstacles. First, the combination of feedback and performance-based incentives—that is, feedback joint with incentives to act on this feedback and achieve specific health outcomes—helps address the knowledge gap that may otherwise undermine performance-based incentives. Second, coupling feedback with auditing helps ensure that the information underlying the feedback is reliable—a prerequisite for effective feedback. To examine the effectiveness of this bundle, we use data from a randomized governance program conducted in the Democratic Republic of Congo. Within the program, a set of health centers were randomly assigned to a “governance treatment” that consisted of performance-based incentives combined with A&F, while others were not. Consistent with our prediction, we find that the governance treatment led to i) higher operating efficiency and ii) improvements in health outcomes. Furthermore, we find that funding is not a substitute for the governance treatment—health centers that only receive funding increase their scale, but do not show improvements in operating efficiency nor health outcomes.",
						},
					],
				},
			},
		},
	});

	const toEvaluate = await prisma.pub.create({
		data: {
			pubTypeId: submissionTypeId,
			communityId: communityUUID,

			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "ADVANCE MARKET COMMITMENTS: INSIGHTS FROM THEORY AND EXPERIENCE",
						},
						{
							fieldId: fieldIds[1],
							value: `Ten years ago, donors committed $1.5 billion to a pilot Advance Market Commitment (AMC) to help purchase pneumococcal vaccine for low-income countries. The AMC aimed to encourage the development of such vaccines, ensure distribution to children in low-income countries, and pilot the AMC mechanism for possible future use. Three vaccines have been developed and more than 150 million children immunized, saving an estimated 700,000 lives. This paper reviews the economic logic behind AMCs, the experience with the pilot, and key issues for future AMCs.`,
						},
					],
				},
			},
		},
	});

	// const evaluating1 = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: submissionTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: 'Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" (Buntaine et al)',
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: 'This will be evaluation 1 of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" - Revised 11 August because of a small oversight',
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const evaluating2 = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: submissionTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: "Artificial Intelligence and Economic Growth”: Philip Trammell",
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: `An evaluation of “Artificial Intelligence and Economic Growth” for Unjournal`,
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const authorRejection = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: submissionTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: "Do Celebrity Endorsements Matter? A Twitter Experiment Promoting Vaccination In Indonesia",
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: `You haver to reject me. Pleseeee. Reject meeeeeeee`,
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const evaluationSummary = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: evaluationSummaryTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: "Evaluation summary and metrics: “Artificial Intelligence and Economic Growth”",
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: `Summary, metrics and ratings, and Manager's comments on Evaluation of “Artificial Intelligence and Economic Growth” by Aghion et al.`,
	// 					},
	// 					{
	// 						fieldId: fieldIds[2],
	// 						value: "Ive never seen a squeaky wheel effect climate change",
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const authorsResponse = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: authorResponseTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: `Authors response to Evaluation 2 of “Artificial Intelligence and Economic Growth”: Philip Trammell`,
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: `You can beleive it or not, but i am telling you right now, that, that AI back there is is not real!`,
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const evaluation1 = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: evaluationTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: 'Evaluation 1 of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" (Buntaine et al)',
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: 'Evaluation 1 of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" - Revised 11 August because of a small oversight',
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

	// const evaluation2 = await prisma.pub.create({
	// 	data: {
	// 		pubTypeId: evaluationTypeId,
	// 		communityId: communityUUID,

	// 		values: {
	// 			createMany: {
	// 				data: [
	// 					{
	// 						fieldId: fieldIds[0],
	// 						value: "Evaluation 2 of “Artificial Intelligence and Economic Growth”: Philip Trammell",
	// 					},
	// 					{
	// 						fieldId: fieldIds[1],
	// 						value: `Philip Trammell's Evaluation 2 of “Artificial Intelligence and Economic Growth” for Unjournal`,
	// 					},
	// 				],
	// 			},
	// 		},
	// 	},
	// });

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
			pubs: {
				connect: [{ id: submission.id }],
			},
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
			pubs: {
				connect: [{ id: submission.id }],
			},
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

	// Submitted --> Consent, To Evaluate, Under Evaluation, Shelved
	await prisma.stage.update({
		where: { id: stageIds[0] },
		data: {
			moveConstraints: {
				createMany: {
					data: [
						{ destinationId: stageIds[0] },
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
						{ destinationId: stageIds[1] },
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
					data: [
						{ destinationId: stageIds[2] },
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[6] },
					],
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
					data: [
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[4] },
						{ destinationId: stageIds[6] },
					],
				},
			},
		},
	});

	// Production --> Evaluation, Published, Shelved
	await prisma.stage.update({
		where: { id: stageIds[4] },
		data: {
			moveConstraints: {
				createMany: {
					data: [
						{ destinationId: stageIds[4] },
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[5] },
						{ destinationId: stageIds[6] },
					],
				},
			},
		},
	});

	// Published --> Evaluation, Production, Shelved
	await prisma.stage.update({
		where: { id: stageIds[5] },
		data: {
			moveConstraints: {
				createMany: {
					data: [
						{ destinationId: stageIds[5] },
						{ destinationId: stageIds[3] },
						{ destinationId: stageIds[4] },
						{ destinationId: stageIds[6] },
					],
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

	await prisma.pub.update({
		where: { id: submission.id },
		data: {
			stages: { connect: { id: stageIds[0] } },
		},
	});
	await prisma.pub.update({
		where: { id: toAskForConsent.id },
		data: {
			stages: { connect: { id: stageIds[1] } },
			permissions: { create: { memberGroupId: memberGroup.id } },
		},
	});
	await prisma.pub.update({
		where: { id: toEvaluate.id },
		data: { stages: { connect: { id: stageIds[2] } } },
	});
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
				// This needs to be registered for emails to work, but we don't want it to show on each pub...hrm...
				{
					name: "evaluate",
					text: "Evaluate Pub",
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

	const pubIds = [...Array(7)].map((x) => uuidv4());
	const submissionToEvaluate = await prisma.pub.create({
		data: {
			pubTypeId: submissionTypeId,
			communityId: communityUUID,
			stages: { connect: { id: stageIds[3] } },

			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "When Celebrities Speak: A Nationwide Twitter Experiment Promoting Vaccination In Indonesia",
						},
						{
							fieldId: fieldIds[1],
							value: "Celebrity endorsements are often sought to influence public opinion. We ask whether celebrity endorsement per se has an effect beyond the fact that their statements are seen by many, and whether on net their statements actually lead people to change their beliefs. To do so, we conducted a nationwide Twitter experiment in Indonesia with 46 high-profile celebrities and organizations, with a total of 7.8 million followers, who agreed to let us randomly tweet or retweet content promoting immunization from their accounts. Our design exploits the structure of what information is passed on along a retweet chain on Twitter to parse reach versus endorsement effects. Endorsements matter: tweets that users can identify as being originated by a celebrity are far more likely to be liked or retweeted by users than similar tweets seen by the same users but without the celebrities' imprimatur. By contrast, explicitly citing sources in the tweets actually reduces diffusion. By randomizing which celebrities tweeted when, we find suggestive evidence that overall exposure to the campaign may influence beliefs about vaccination and knowledge of immunization-seeking behavior by one's network. Taken together, the findings suggest an important role for celebrity endorsement.",
						},
						{
							fieldId: fieldIds[8],
							value: "10.3386/w25589",
						},
					],
				},
			},
		},
	});
}
