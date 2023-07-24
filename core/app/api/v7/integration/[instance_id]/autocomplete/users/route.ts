import prisma from "prisma/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id

	try {
		const namesStartingWith = await prisma.user.findMany({
			where: {
				name: {
					startsWith: `${request.nextUrl.searchParams.get("name")}`,
				},
			},
			take: 10,
			select: {
				name: true,
			},
		});
		console.log("Response", namesStartingWith);
		return NextResponse.json({ suggestion: "namesStartingWith" });
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}
