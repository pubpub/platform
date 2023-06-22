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
	const frankensteinUUID = uuidv4();
	const fieldIDs = [...Array(6)].map((x) => uuidv4());
	const community = await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Commonplace",
			pubTypes: {
				create: [
					{
						name: "Book",
						metadataFields: {
							create: [
								{ id: fieldIDs[0], name: "title" },
								{ id: fieldIDs[1], name: "isbn" },
								{ id: fieldIDs[2], name: "publicationDate" },
							],
						},
						pubs: {
							create: [
								{
									id: frankensteinUUID,
									communityId: communityUUID,
									metadataBlob: [
										{ fieldId: fieldIDs[0], value: "Frankenstein" },
										{ fieldId: fieldIDs[1], value: "10234-123414" },
										{ fieldId: fieldIDs[2], value: "1959" },
									],
									metadataValues: {
										create: [
											{ fieldId: fieldIDs[0], value: "Frankenstein" },
											{ fieldId: fieldIDs[1], value: "10234-123414" },
											{ fieldId: fieldIDs[2], value: "1959" },
										],
									},
								},
							],
						},
					},
					{
						name: "Chapter",
						metadataFields: {
							create: [
								{ id: fieldIDs[3], name: "title" },
								{ id: fieldIDs[4], name: "files" },
							],
						},
						pubs: {
							create: [
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadataBlob: [
										{ fieldId: fieldIDs[3], value: "Chapter 1" },
										{ fieldId: fieldIDs[4], value: ["internet/chapter1.html"] },
									],
									metadataValues: {
										create: [
											{ fieldId: fieldIDs[3], value: "Chapter 1" },
											{
												fieldId: fieldIDs[4],
												value: ["internet/chapter1.html"],
											},
										],
									},
								},
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadataBlob: [
										{ fieldId: fieldIDs[3], value: "Chapter 2" },
										{ fieldId: fieldIDs[4], value: ["internet/chapter2.html"] },
									],
									metadataValues: {
										create: [
											{ fieldId: fieldIDs[3], value: "Chapter 2" },
											{
												fieldId: fieldIDs[4],
												value: ["internet/chapter2.html"],
											},
										],
									},
								},
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadataBlob: [
										{ fieldId: fieldIDs[3], value: "Chapter 3" },
										{ fieldId: fieldIDs[4], value: ["internet/chapter3.html"] },
									],
									metadataValues: {
										create: [
											{ fieldId: fieldIDs[3], value: "Chapter 3" },
											{
												fieldId: fieldIDs[4],
												value: ["internet/chapter3.html"],
											},
										],
									},
								},
							],
						},
					},
					{
						name: "Journal",
						metadataFields: {
							create: [
								{ name: "title" },
								{ name: "publisher" },
								{ name: "publicationDate" },
							],
						},
					},
				],
			},
		},
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
