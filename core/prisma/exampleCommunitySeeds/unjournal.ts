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

	const fieldIds = [...Array(4)].map((x) => uuidv4());
	await prisma.pubField.createMany({
		data: [
			{ id: fieldIds[0], name: "Title" },
			{ id: fieldIds[1], name: "Description" },
			{ id: fieldIds[2], name: "Manager's Notes" },
			{ id: fieldIds[3], name: "Parent" },
		],
	});

	const typeIds = [...Array(4)].map((x) => uuidv4());

	await prisma.pubType.create({
		data: {
			id: typeIds[0],
			name: "Collection",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }],
			},
		},
	});

	await prisma.pubType.create({
		data: {
			id: typeIds[1],
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

	await prisma.pubType.create({
		data: {
			id: typeIds[2],
			name: "Evaluation",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
			},
		},
	});

	await prisma.pubType.create({
		data: {
			id: typeIds[3],
			name: "Author Response",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
			},
		},
	});

	/*--Top level pub---*/
	const parentPub1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [{ fieldId: fieldIds[0], value: "Evaluation's in Progress" }],
				},
			},
		},
	});

	const evaluation1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: 'Evaluation 1 of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" (Buntaine et al)',
						},
						{
							fieldId: fieldIds[1],
							value: 'Evaluation 1 of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China" - Revised 11 August because of a small oversight',
						},
						{ fieldId: fieldIds[3], value: parentPub1.id },
					],
				},
			},
		},
	});

	const evaluation2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Evaluation 2 of “Artificial Intelligence and Economic Growth”: Philip Trammell",
						},
						{
							fieldId: fieldIds[1],
							value: `Philip Trammell's Evaluation 2 of “Artificial Intelligence and Economic Growth” for Unjournal`,
						},
						{ fieldId: fieldIds[3], value: parentPub1.id },
					],
				},
			},
		},
	});

	/*--Top level pub---*/
	const parentPub2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [{ fieldId: fieldIds[0], value: "Evaluation Summaries and Metrics" }],
				},
			},
		},
	});

	const evaluationSummary1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Evaluation summary and metrics: “Artificial Intelligence and Economic Growth”",
						},
						{
							fieldId: fieldIds[1],
							value: `Summary, metrics and ratings, and Manager's comments on Evaluation of “Artificial Intelligence and Economic Growth” by Aghion et al.`,
						},
						{
							fieldId: fieldIds[2],
							value: "Ive never seen a squeaky wheel effect climate change",
						},
						{ fieldId: fieldIds[3], value: parentPub2.id },
					],
				},
			},
		},
	});

	const evaluationSummary2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: `Evaluation Summary and Metrics: "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China"`,
						},
						{
							fieldId: fieldIds[1],
							value: `Evaluation Summary and Metrics: "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China"`,
						},
						{
							fieldId: fieldIds[2],
							value: "Ive never seen an 'AI'. Prove it.",
						},
						{ fieldId: fieldIds[3], value: parentPub2.id },
					],
				},
			},
		},
	});

	/*--Top level pub---*/
	const parentPub3 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [{ fieldId: fieldIds[0], value: "Author Responses" }],
				},
			},
		},
	});

	const authorsResponse = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: `Authors response to the Evaluation of "Does the Squeaky Wheel Get More Grease? The Direct and Indirect Effects of Citizen Participation on Environmental Governance in China"`,
						},
						{
							fieldId: fieldIds[1],
							value: `Wealth. Fame. Power. The man who had acquired everything in this world, the Pirate King, Gol D. Roger. The final words that were said at his execution, sent people to the seas. "My wealth and treasures? If you want it, I'll let you have it. Look for it, I left it all at that place." Ever since, pirates from all over the world set sail for the Grand Line, searching for One Piece, the treasure that would make their dreams come true.`,
						},
						{ fieldId: fieldIds[3], value: parentPub3.id },
					],
				},
			},
		},
	});

	const authorsResponse2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: `Authors response to Evaluation 2 of “Artificial Intelligence and Economic Growth”: Philip Trammell`,
						},
						{
							fieldId: fieldIds[1],
							value: `You can beleive it or not, but i am telling you right now, that, that AI back there is is not real!`,
						},
						{ fieldId: fieldIds[3], value: parentPub3.id },
					],
				},
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
	await prisma.pub.update({
		where: { id: evaluation1.id },
		data: { stages: { connect: { id: stageIds[3] } } },
	});
	await prisma.pub.update({
		where: { id: evaluation2.id },
		data: { stages: { connect: { id: stageIds[3] } } },
	});
	await prisma.pub.update({
		where: { id: evaluationSummary1.id },
		data: { stages: { connect: { id: stageIds[4] } } },
	});
	await prisma.pub.update({
		where: { id: evaluationSummary2.id },
		data: { stages: { connect: { id: stageIds[4] } } },
	});
	await prisma.pub.update({
		where: { id: authorsResponse.id },
		data: { stages: { connect: { id: stageIds[4] } } },
	});
	await prisma.pub.update({
		where: { id: authorsResponse2.id },
		data: { stages: { connect: { id: stageIds[4] } } },
	});

	const siteIntegration = await prisma.integration.create({
		data: {
			name: "Site Builder",
			actions: [
				{
					text: "Manage Site",
					href: "https://integrations.pubpub.org/sitebuilder/manage",
				},
			],
			settingsUrl: "https://integrations.pubpub.org/sitebuilder/settings",
		},
	});

	const evaluationIntegration = await prisma.integration.create({
		data: {
			name: "Evaluation Manager",
			actions: [
				{
					text: "Manage Evaluation",
					href: "https://integrations.pubpub.org/evaluation/manage",
				},
			],
			settingsUrl: "https://integrations.pubpub.org/evaluation/settings",
		},
	});

	const doiIntegration = await prisma.integration.create({
		data: {
			name: "DOI Registration",
			actions: [{ text: "Register DOI", href: "https://integrations.pubpub.org/doi/manage" }],
			settingsUrl: "https://integrations.pubpub.org/doi/settings",
		},
	});

	const socialMediaIntegration = await prisma.integration.create({
		data: {
			name: "Share",
			actions: [
				{
					text: "Share on social media",
					href: "https://integrations.pubpub.org/share/manage",
				},
			],
			settingsUrl: "https://integrations.pubpub.org/share/settings",
		},
	});

	await prisma.integrationInstance.create({
		data: {
			name: "unjournal.evaluations.org",
			integrationId: siteIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [{ id: stageIds[5] }],
			},
		},
	});

	await prisma.integrationInstance.create({
		data: {
			name: "The Unjournal evaluation process manager",
			integrationId: evaluationIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [
					{ id: stageIds[0] },
					{ id: stageIds[1] },
					{ id: stageIds[2] },
					{ id: stageIds[3] },
					{ id: stageIds[4] },
					{ id: stageIds[5] },
					{ id: stageIds[6] },
				],
			},
		},
	});

	await prisma.integrationInstance.create({
		data: {
			name: "Crossref DOI",
			integrationId: doiIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [{ id: stageIds[5] }],
			},
		},
	});

	await prisma.integrationInstance.create({
		data: {
			name: "Share on Social Media",
			integrationId: socialMediaIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [{ id: stageIds[5] }],
			},
		},
	});

	const integrationFieldIds = [...Array(2)].map((x) => uuidv4());
	await prisma.pubField.createMany({
		data: [
			{
				id: integrationFieldIds[0],
				name: "sitebuilder/status",
				integrationId: siteIntegration.id,
			},
			{
				id: integrationFieldIds[1],
				name: "evaluation/status",
				integrationId: evaluationIntegration.id,
			},
		],
	});

	await prisma.pubValue.createMany({
		data: [
			{
				pubId: parentPub2.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#72BE47", text: "unjournal summaries and metrics site built" },
			},
			{
				pubId: parentPub2.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#72BE47", text: "Author's Responses to evaluations site built" },
			},
			{
				pubId: evaluation1.id,
				fieldId: integrationFieldIds[1],
				value: {
					color: "#E1C04C",
					text: "Collecting responses, summaries, and statistics",
				},
			},
			{
				pubId: evaluation2.id,
				fieldId: integrationFieldIds[1],
				value: {
					color: "#E1C04C",
					text: "Collecting responses, summaries, and statistics",
				},
			},
		],
	});
}
