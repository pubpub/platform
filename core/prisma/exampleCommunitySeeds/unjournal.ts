import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: "/demo/unjournal.png",
		},
	});

	const fieldIds = [...Array(8)].map(() => uuidv4());

	await prisma.pubField.createMany({
		data: [
			{ id: fieldIds[0], name: "Title" },
			{ id: fieldIds[1], name: "Description" },
			{ id: fieldIds[2], name: "Manager's Notes" },
			{ id: fieldIds[3], name: "Parent" },
			{ id: fieldIds[4], name: "Children" },
			{ id: fieldIds[5], name: "Content" },
			{ id: fieldIds[6], name: "Evaluated Paper" },
			{ id: fieldIds[7], name: "Tags" },
			{ id: fieldIds[8], name: "DOI" },
		],
	});

	const submissionTypeId = "e09e894f-b3cf-4e9b-aeaa-48f7cb8c6225";
	await prisma.pubType.create({
		data: {
			id: submissionTypeId,
			name: "Submission",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }],
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
				connect: [
					{ id: fieldIds[0] },
					{ id: fieldIds[1] },
					{ id: fieldIds[2] },
					{ id: fieldIds[3] },
				],
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
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
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
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
			},
		},
	});

	const stageIds = [...Array(7)].map((x) => uuidv4());
	await prisma.stage.createMany({
		data: [
			{ id: stageIds[0], communityId: communityUUID, name: "Submitted", order: "aa" },
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

	// Submitted --> Consent, To Evaluate, Under Evaluation, Shelved
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

	// Production --> Evaluation, Published, Shelved
	await prisma.stage.update({
		where: { id: stageIds[4] },
		data: {
			moveConstraints: {
				createMany: {
					data: [
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

	const semanticScholarIntegration = await prisma.integration.create({
		data: {
			name: "Semantic Scholar",
			actions: [
				{
					text: "Add paper from Semantic Scholar",
					href: "https://integration-evaluations.onrender.com/run",
				},
			],
			settingsUrl: "https://integration-evaluations.onrender.com/configure",
		},
	});

	const openAlexIntegration = await prisma.integration.create({
		data: {
			name: "OpenAlex",
			actions: [
				{
					text: "Add work from OpenAlex",
					href: "https://integration-evaluations.onrender.com/run",
				},
			],
			settingsUrl: "https://integration-evaluations.onrender.com/configure",
		},
	});

	const crossrefIntegration = await prisma.integration.create({
		data: {
			name: "Crossref",
			actions: [
				{
					text: "Add work from Crossref",
					href: "https://integration-evaluations.onrender.com/run",
				},
			],
			settingsUrl: "https://integration-evaluations.onrender.com/configure",
		},
	});

	const openCitationsInegration = await prisma.integration.create({
		data: {
			name: "Open Citations",
			actions: [
				{
					text: "Add work from open citation",
					href: "https://integration-submissions.onrender.com/run",
				},
			],
			settingsUrl: "https://integration-submissions.onrender.com/configure",
		},
	});

	const keywordExtractionIntegration = await prisma.integration.create({
		data: {
			name: "Keyword Extraction",
			actions: [
				{
					text: "Extract Keywords",
					href: "https://integration-submissions.onrender.com/run",
				},
			],
			settingsUrl: "https://integration-submissions.onrender.com/configure",
		},
	});

	const submissionsIntegrationUrl =
		process.env.NODE_ENV === "production"
			? "https://integration-submissions.onrender.com"
			: "http://localhost:3002";
	const submissionsIntegration = await prisma.integration.create({
		data: {
			name: "Submission Manager",
			actions: [
				{
					text: "Submit Pub",
					href: `${submissionsIntegrationUrl}/actions/submit`,
					kind: "stage",
				},
			],
			settingsUrl: `${submissionsIntegrationUrl}/configure`,
		},
	});

	const evaluationIntegrationUrl =
		process.env.NODE_ENV === "production"
			? "https://integration-evaluations.onrender.com"
			: "http://localhost:3001";
	const evaluationIntegration = await prisma.integration.create({
		data: {
			name: "Evaluation Manager",
			actions: [
				{
					text: "Manage Evaluation",
					href: `${evaluationIntegrationUrl}/actions/manage`,
				},
			],
			settingsUrl: `${evaluationIntegrationUrl}/configure`,
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
			integrationId: evaluationIntegration.id,
			stageId: stageIds[3],
		},
	];

	Promise.all(
		integrationInstances.map((instanceData) => {
			return prisma.integrationInstance.create({
				data: {
					communityId: communityUUID,
					...instanceData,
				},
			});
		})
	);

	/**I have not thought about how these fields are used well enough */
	// const integrationFieldIds = [...Array(2)].map((x) => uuidv4());
	// await prisma.pubField.createMany({
	// 	data: [
	// 		{
	// 			id: integrationFieldIds[0],
	// 			name: "sitebuilder/status",
	// 			integrationId: siteIntegration.id,
	// 		},
	// 		{
	// 			id: integrationFieldIds[1],
	// 			name: "evaluation/status",
	// 			integrationId: evaluationIntegration.id,
	// 		},
	// 	],
	// });

	// await prisma.pubValue.createMany({
	// 	data: [
	// 		{
	// 			pubId: parentPub2.id,
	// 			fieldId: integrationFieldIds[0],
	// 			value: { color: "#72BE47", text: "unjournal summaries and metrics site built" },
	// 		},
	// 		{
	// 			pubId: parentPub2.id,
	// 			fieldId: integrationFieldIds[0],
	// 			value: { color: "#72BE47", text: "Author's Responses to evaluations site built" },
	// 		},
	// 		{
	// 			pubId: evaluation1.id,
	// 			fieldId: integrationFieldIds[1],
	// 			value: {
	// 				color: "#E1C04C",
	// 				text: "Collecting responses, summaries, and statistics",
	// 			},
	// 		},
	// 		{
	// 			pubId: evaluation2.id,
	// 			fieldId: integrationFieldIds[1],
	// 			value: {
	// 				color: "#E1C04C",
	// 				text: "Collecting responses, summaries, and statistics",
	// 			},
	// 		},
	// 	],
	// });
}
