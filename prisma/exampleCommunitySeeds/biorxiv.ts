import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export default async function main(prisma: PrismaClient, communityUUID: string) {
	const community = await prisma.community.create({
		data: {
			id: communityUUID,
			name: "BioRxiv",
			avatar: "/demo/biorxiv.ico",
		},
	});
	const fieldIds = [...Array(7)].map((x) => uuidv4());
	const fields = await prisma.pubField.createMany({
		data: [
			{ id: fieldIds[0], name: "Title" },
			{ id: fieldIds[1], name: "ISBN" },
			{ id: fieldIds[2], name: "DOI" },
			{ id: fieldIds[3], name: "Publication Date" },
			{ id: fieldIds[4], name: "Files" },
			{ id: fieldIds[5], name: "Contributors" },
			{ id: fieldIds[6], name: "Parent" },
		],
	});
	const typeIds = [...Array(6)].map((x) => uuidv4());
	/* Nested createMany not possible yet, but maybe in the works */
	/* https://github.com/prisma/prisma/issues/5455 */
	/* ------------- */
	await prisma.pubType.create({
		data: {
			id: typeIds[0],
			name: "Subject Area",
			communityId: communityUUID,
			fields: {
				connect: [
					{ id: fieldIds[0] },
					{ id: fieldIds[1] },
					{ id: fieldIds[3] },
					{ id: fieldIds[4] },
					{ id: fieldIds[5] },
				],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[1],
			name: "Preprint",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[4] }],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[2],
			name: "Journal",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[3],
			name: "Issue",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[3] }],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[4],
			name: "Article",
			communityId: communityUUID,
			fields: {
				connect: [
					{ id: fieldIds[0] },
					{ id: fieldIds[2] },
					{ id: fieldIds[3] },
					{ id: fieldIds[4] },
					{ id: fieldIds[5] },
				],
			},
		},
	});
	/* ------------- */
	const topPub1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [{ fieldId: fieldIds[0], value: "Biochemistry" }],
				},
			},
		},
	});
	const chapter1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Structure-function relationships underpin disulfide loop cleavage-dependent activation of Legionella pneumophila lysophosholipase A PlaA",
						},
						{ fieldId: fieldIds[4], value: "chapter1.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});
	const chapter2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Noncanonical usage of stop codons in ciliates expands proteins with structurally flexible Q-rich motifs",
						},
						{ fieldId: fieldIds[4], value: "chapter2.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});
	const chapter3 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Increased levels of eIF2A inhibit translation by sequestering 40S ribosomal subunits",
						},
						{ fieldId: fieldIds[4], value: "chapter3.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});

	/* Top Pub 2 */
	const topPub2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Neuroscience" },
						{ fieldId: fieldIds[1], value: "123-156612-3521" },
					],
				},
			},
		},
	});
	const issue1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Bimodal inference in humans and mice" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const issue2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Determinants of Astrocytic Pathology in Stem Cell Models of Primary Tauopathies",
						},
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Human Adult Neurogenesis Loss Underlies Cognitive Decline During Epilepsy Progression",
						},
						{ fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article1.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Modulation of dorsal premotor cortex disrupts neuroplasticity of primary motor cortex in young and older adults",
						},
						{ fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article3 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Microprism-based two-photon imaging of the lateral cortex of the mouse inferior colliculus reveals novel organizational principles of the auditory midbrain",
						},
						{ fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article3.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article4 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Sodium channel endocytosis drives axon initial segment plasticity",
						},
						{ fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article4.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article5 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[1],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{
							fieldId: fieldIds[0],
							value: "Synaptic and dendritic architecture of two types of hippocampal somatostatin interneurons",
						},
						{ fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article5.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});

	const stageIds = [...Array(12)].map((x) => uuidv4());
	await prisma.stage.createMany({
		data: [
			{
				id: stageIds[0],
				communityId: communityUUID,
				name: "Submissions/Revisions in Progress",
				order: "aa",
			},
			{ id: stageIds[1], communityId: communityUUID, name: "Under Conversion", order: "bb" },
			{
				id: stageIds[2],
				communityId: communityUUID,
				name: "Ready to Proof",
				order: "cc",
			},
			{
				id: stageIds[3],
				communityId: communityUUID,
				name: "Ready for Registration",
				order: "dd",
			},
			{ id: stageIds[4], communityId: communityUUID, name: "Completed Papers", order: "ee" },
		],
	});

	await prisma.pub.update({
		where: { id: article1.id },
		data: { stages: { connect: { id: stageIds[1] } } },
	});
	await prisma.pub.update({
		where: { id: article2.id },
		data: { stages: { connect: { id: stageIds[1] } } },
	});
	await prisma.pub.update({
		where: { id: article3.id },
		data: { stages: { connect: { id: stageIds[3] } } },
	});
	await prisma.pub.update({
		where: { id: article4.id },
		data: { stages: { connect: { id: stageIds[3] } } },
	});
	await prisma.pub.update({
		where: { id: article5.id },
		data: { stages: { connect: { id: stageIds[4] } } },
	});

	await prisma.stage.createMany({
		data: [
			{
				id: stageIds[5],
				communityId: communityUUID,
				name: "Paper Initialize",
				order: "aa",
			},
			{
				id: stageIds[6],
				communityId: communityUUID,
				name: "Layout and Editing",
				order: "bb",
			},
			{
				id: stageIds[7],
				communityId: communityUUID,
				name: "Invited Annotations",
				order: "bb",
			},
			{
				id: stageIds[8],
				communityId: communityUUID,
				name: "Community Annotation",
				order: "dd",
			},
		],
	});

	await prisma.pub.update({
		where: { id: chapter1.id },
		data: { stages: { connect: { id: stageIds[6] } } },
	});
	await prisma.pub.update({
		where: { id: chapter2.id },
		data: { stages: { connect: { id: stageIds[7] } } },
	});
	await prisma.pub.update({
		where: { id: chapter3.id },
		data: { stages: { connect: { id: stageIds[7] } } },
	});

	// Per pub in stage
	const reviewIntegration = await prisma.integration.create({
		data: {
			name: "Reviews",
			actions: [
				{ text: "Manage Review", href: "https://integrations.pubpub.org/reviews/manage" },
			],
			settingsUrl: "https://integrations.pubpub.org/reviews/settings",
		},
	});

	// Per pub in stage
	const doiIntegration = await prisma.integration.create({
		data: {
			name: "DOI Registration",
			actions: [{ text: "Register DOI", href: "https://integrations.pubpub.org/doi/manage" }],
			settingsUrl: "https://integrations.pubpub.org/doi/settings",
		},
	});

	// On single pub
	const siteIntegration = await prisma.integration.create({
		data: {
			name: "Site Builder v1",
			actions: [
				{
					text: "Manage Site",
					href: "https://integrations.pubpub.org/sitebuilder_v1/manage",
				},
			],
			settingsUrl: "https://integrations.pubpub.org/sitebuilder_v1/settings",
		},
	});

	const archiveIntegration = await prisma.integration.create({
		data: {
			name: "Portico Archiver",
			actions: [
				{
					text: "Manage Archive",
					href: "https://integrations.pubpub.org/portico/manage",
				},
			],
			settingsUrl: "https://integrations.pubpub.org/portico/settings",
		},
	});

	const reviewInstances = await prisma.integrationInstance.create({
		data: {
			name: "BioRxiv Staff review process",
			integrationId: reviewIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [{ id: stageIds[1] }, { id: stageIds[7] }],
			},
		},
	});

	const doiInstances = await prisma.integrationInstance.create({
		data: {
			name: "Crossref DOI",
			integrationId: doiIntegration.id,
			communityId: communityUUID,
			stages: {
				connect: [{ id: stageIds[3] }],
			},
		},
	});
	const archiveInstance1 = await prisma.integrationInstance.create({
		data: {
			name: "Neuroscience Archive",
			integrationId: archiveIntegration.id,
			communityId: communityUUID,
			pubs: {
				connect: [{ id: topPub2.id }],
			},
		},
	});
	const siteInstance1 = await prisma.integrationInstance.create({
		data: {
			name: "biorxiv.org",
			integrationId: siteIntegration.id,
			communityId: communityUUID,
			pubs: {
				connect: [{ id: topPub2.id }],
			},
		},
	});
	// const siteInstance2 = await prisma.integrationInstance.create({
	// 	data: {
	// 		name: "frankenbook.org",
	// 		integrationId: siteIntegration.id,
	// 		communityId: communityUUID,
	// 		pubs: {
	// 			connect: [{ id: topPub1.id }],
	// 		},
	// 	},
	// });

	const integrationFieldIds = [...Array(4)].map((x) => uuidv4());
	await prisma.pubField.createMany({
		data: [
			{
				id: integrationFieldIds[0],
				name: "reviews/status",
				integrationId: reviewIntegration.id,
			},
			{ id: integrationFieldIds[1], name: "doi/status", integrationId: doiIntegration.id },
			{
				id: integrationFieldIds[2],
				name: "sitebuilder_v1/status",
				integrationId: siteIntegration.id,
			},
			{
				id: integrationFieldIds[3],
				name: "portico/status",
				integrationId: archiveIntegration.id,
			},
		],
	});

	await prisma.pubValue.createMany({
		data: [
			{
				pubId: article1.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#E1C04C", text: "Review Pending" },
			},
			{
				pubId: article2.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#72BE47", text: "Review Complete" },
			},
			{
				pubId: article3.id,
				fieldId: integrationFieldIds[1],
				value: { color: "#72BE47", text: "DOI Registered" },
			},
			{
				pubId: article4.id,
				fieldId: integrationFieldIds[1],
				value: { color: "#ED6559", text: "DOI Missing" },
			},
			{
				pubId: chapter2.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#E1C04C", text: "Review Pending" },
			},
			{
				pubId: chapter3.id,
				fieldId: integrationFieldIds[0],
				value: { color: "#ED6559", text: "Review Unstarted" },
			},
			{
				pubId: topPub2.id,
				fieldId: integrationFieldIds[2],
				value: { color: "#72BE47", text: "Site built" },
			},
			{
				pubId: topPub2.id,
				fieldId: integrationFieldIds[3],
				value: { color: "#E1C04C", text: "Archive not submitted" },
			},
			{
				pubId: topPub1.id,
				fieldId: integrationFieldIds[2],
				value: { color: "#E1C04C", text: "Site building..." },
			},
		],
	});
}
