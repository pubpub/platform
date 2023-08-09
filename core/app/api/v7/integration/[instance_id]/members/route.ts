import prisma from "prisma/db";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
	if (!request.nextUrl.searchParams.has("name")) {
		return new NextResponse('{ error: "Missing name parameter" }', {
			status: 400,
		});
	}

	const namesStartingWith = await prisma.user.findMany({
		where: {
			name: {
				startsWith: `${request.nextUrl.searchParams.get("name")}`,
				mode: "insensitive",
			},
		},
		take: 10,
		select: {
			name: true,
		},
	});

	return NextResponse.json({ suggestion: namesStartingWith });
}
