import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
async function main() {
	const mainUserId = "a9a09993-8eb1-4122-abbf-b999d5c8afe3";
	const data = await prisma.user.create({
		data: {
			id: mainUserId,
			slug: "testing",
			email: "test@testing.com",
			name: "Atta Test",
		},
	});
	const communityUUID = uuidv4();
	const community = await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Arcadia Science",
			avatar: "/logos/arcadia.png",
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
			name: "Project",
			description: "Top level pub for all major project endeavors.",
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
			name: "Resource",
			description: "Content for community re-use and distribution.",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[4] }],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[2],
			name: "Data set",
			description: "Published data made publicly available.",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[1] }, { id: fieldIds[3] }],
			},
		},
	});
	await prisma.pubType.create({
		data: {
			id: typeIds[3],
			name: "Method",
			description: "Method paper used to describe specific process in detail.",
			communityId: communityUUID,
			fields: {
				connect: [{ id: fieldIds[0] }, { id: fieldIds[3] }],
			},
		},
	});
	// await prisma.pubType.create({
	// 	data: {
	// 		id: typeIds[4],
	// 		name: "Article",
	// 		communityId: communityUUID,
	// 		fields: {
	// 			connect: [
	// 				{ id: fieldIds[0] },
	// 				{ id: fieldIds[2] },
	// 				{ id: fieldIds[3] },
	// 				{ id: fieldIds[4] },
	// 				{ id: fieldIds[5] },
	// 			],
	// 		},
	// 	},
	// });
	/* ------------- */
	const topPub1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[0],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [{ fieldId: fieldIds[0], value: "Ticks as treasure troves: Molecular discovery in new organisms" }],
				},
			},
		},
	});
	const chapter1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Robust long-read saliva transcriptome and proteome from the lone star tick, Amblyomma americanum" },
						{ fieldId: fieldIds[4], value: "chapter1.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});
	const chapter2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "De novo assembly of a long-read Amblyomma americanum tick genome" },
						{ fieldId: fieldIds[4], value: "chapter2.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});
	const chapter3 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Performing mass spectrometry-based proteomics in organisms with minimal reference protein databases" },
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
						{ fieldId: fieldIds[0], value: "Genetics: Decoding evolutionary drivers across biology" },
						{ fieldId: fieldIds[1], value: "123-156612-3521" },
					],
				},
			},
		},
	});
	const issue1 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Distinct spatiotemporal movement properties reveal sub-modalities in crawling cell types" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const issue2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Raman spectra reflect complex phylogenetic relationships" },
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
						{ fieldId: fieldIds[0], value: "Phenotypic differences between interfertile Chlamydomonas species" },
						// { fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article1.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});
	const article2 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[2],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Designing genome-wide MERFISH probes for understudied species" },
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
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "A workflow to isolate phage DNA and identify nucleosides by HPLC and mass spectrometry" },
						// { fieldId: fieldIds[5], value: "Xiao-Li Meng" },
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
						{ fieldId: fieldIds[0], value: "Distinct spatiotemporal movement properties reveal sub-modalities in crawling cell types" },
						// { fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article4.html" },
						{ fieldId: fieldIds[6], value: topPub1.id },
					],
				},
			},
		},
	});
	const article5 = await prisma.pub.create({
		data: {
			pubTypeId: typeIds[3],
			communityId: communityUUID,
			values: {
				createMany: {
					data: [
						{ fieldId: fieldIds[0], value: "Microchamber slide design for cell confinement during imaging" },
						// { fieldId: fieldIds[5], value: "Xiao-Li Meng" },
						{ fieldId: fieldIds[4], value: "article5.html" },
						{ fieldId: fieldIds[6], value: topPub2.id },
					],
				},
			},
		},
	});

	const stageIds = [...Array(12)].map((x) => uuidv4());
	const workflow1 = await prisma.workflow.create({
		data: {
			name: "Arcadia Team Review Process",
			communityId: communityUUID,
			stages: {
				createMany: {
					data: [
						{ id: stageIds[0], name: "Submitted", order: "aa" },
						{ id: stageIds[1], name: "Ready for Review", order: "bb" },
						{ id: stageIds[2], name: "Ready for Copyedit", order: "cc" },
						{ id: stageIds[3], name: "Ready for Registration", order: "dd" },
						{ id: stageIds[4], name: "Completed", order: "ee" },
					],
				},
			},
		},
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

	const workflow2 = await prisma.workflow.create({
		data: {
			name: "Community Annotation Workflow",
			communityId: communityUUID,
			stages: {
				createMany: {
					data: [
						{ id: stageIds[5], name: "Chapter Initialize", order: "aa" },
						{ id: stageIds[6], name: "Layout and Editing", order: "bb" },
						{ id: stageIds[7], name: "Invited Annotations", order: "bb" },
						{ id: stageIds[8], name: "Community Annotation", order: "dd" },
					],
				},
			},
		},
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
			name: "Arcadia review form",
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
			name: "PMC Archive",
			integrationId: archiveIntegration.id,
			communityId: communityUUID,
			pubs: {
				connect: [{ id: topPub2.id }],
			},
		},
	});
	const siteInstance1 = await prisma.integrationInstance.create({
		data: {
			name: "research.arcadiascience.com",
			integrationId: siteIntegration.id,
			communityId: communityUUID,
			pubs: {
				connect: [{ id: topPub2.id }],
			},
		},
	});
	const siteInstance2 = await prisma.integrationInstance.create({
		data: {
			name: "ticks.arcadiascience.org",
			integrationId: siteIntegration.id,
			communityId: communityUUID,
			pubs: {
				connect: [{ id: topPub1.id }],
			},
		},
	});

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

	const pins = await prisma.pin.createMany({
		data: [
			{ userId: mainUserId, pubId: topPub2.id },
			{ userId: mainUserId, pubId: topPub1.id },
			{ userId: mainUserId, workflowId: workflow1.id },
		],
	});
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
