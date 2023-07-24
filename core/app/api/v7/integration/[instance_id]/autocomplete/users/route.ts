import prisma from "prisma/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
	console.log(request);
	try {
		const namesStartingWithSt = await prisma.user.findMany({
			where: {
				name: {
					startsWith: `${"request.body"}`,
				},
			},
			take: 10,
			select: {
				name: true,
			},
		});

		return NextResponse.json({ suggestion: namesStartingWithSt });
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}
