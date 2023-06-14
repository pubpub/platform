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
