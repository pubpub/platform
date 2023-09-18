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

	const fieldIds = [...Array(9)].map(() => uuidv4());

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
			moveConstraintSources: {
				createMany: {
					data: [{ stageId: stageIds[0] }],
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
			moveConstraintSources: {
				createMany: {
					data: [{ stageId: stageIds[0] }, { stageId: stageIds[1] }],
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
			moveConstraintSources: {
				createMany: {
					data: [
						{ stageId: stageIds[0] },
						{ stageId: stageIds[1] },
						{ stageId: stageIds[2] },
					],
				},
			},
		},
	});

	// Production --> Under Evaluation, Published, Shelved
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
			moveConstraintSources: {
				createMany: {
					data: [{ stageId: stageIds[3] }],
				},
			},
		},
	});

	// Published --> Under Evaluation, Production, Shelved
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
			moveConstraintSources: {
				createMany: {
					data: [{ stageId: stageIds[4] }],
				},
			},
		},
	});

	// Shelved --> No Constraints?
	await prisma.stage.update({
		where: { id: stageIds[6] },
		data: {
			moveConstraintSources: {
				createMany: {
					data: [
						{ stageId: stageIds[0] },
						{ stageId: stageIds[1] },
						{ stageId: stageIds[2] },
						{ stageId: stageIds[3] },
						{ stageId: stageIds[4] },
						{ stageId: stageIds[5] },
					],
				},
			},
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
