import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Unjournal",
			slug: "unjournal",
			avatar: "/demo/unjournal.jpg",
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
					data: [{ fieldId: fieldIds[0], value: "Completed Evaluation's" }],
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
				name: "Ask Author dor Consent",
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
}
