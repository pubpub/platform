import prisma from "prisma/db";

export async function GET(request: Request) {
    // return candidates for autocompleting a form with suggestions from the pubpub user database
    // should search by name and email, but probably only return name and id
    	// try {
		// 	const namesStartingWithSt = await prisma.user.findMany({
		// 		where: {
		// 			name: {
		// 				startsWith: { mode: "insensitive", value: "st" },
		// 			},
		// 		},
		// 		take: 10,
		// 		select: {
		// 			name: true,
		// 		},
		// 	});

		// 	return namesStartingWithSt;
		// } catch (error) {
		// 	console.error(error);
		// 	throw error;
		// } finally {
		// 	await prisma.$disconnect();
		// }
}