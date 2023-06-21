import { PrismaClient } from "@prisma/client";
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
	const communityUUID = "33222293-8eb1-4122-abbf-b999d5c8afe3";
	const frankensteinUUID = "a9a09993-8eb1-4122-abbf-b999d5c8afe3";
	const community = await prisma.community.create({
		data: {
			id: communityUUID,
			name: "Commonplace",
			pubTypes: {
				create: [
					{
						name: "Book",
						fields: ["title", "isbn", "publicationDate"],
						pubs: {
							create: [
								{
									id: frankensteinUUID,
									communityId: communityUUID,
									metadata: {
										create: [
											{
												type: "title",
												value: "Frankenstein"
											},
											{
												type: "ISBN",
												value: "10234-123414"
											},
											{
												type: "publicationDate",
												value: "1959"
											}
										]
									}
								}
							]
						}
					},
					{
						name: "Chapter",
						fields: ["title", "files"],
						pubs: {
							create: [
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadata: {
										create: [
											{
												type: "title",
												value: "Chapter 1"
											},
											{
												type: "files",
												value: ["internet/chapter1.html"]
											},
											
										]
									}
								},
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadata: {
										create: [
											{
												type: "title",
												value: "Chapter 2"
											},
											{
												type: "files",
												value: ["internet/chapter2.html"]
											},
											
										]
									}
								},
								{
									communityId: communityUUID,
									parentId: frankensteinUUID,
									metadata: {
										create: [
											{
												type: "title",
												value: "Chapter 3"
											},
											{
												type: "files",
												value: ["internet/chapter3.html"]
											},
											
										]
									}
								}
							]
						}
					},
					{
						name: "Journal",
						fields: ["title", "publisher", "publicationDate"],
					}
				]
			}
		}
	})
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
