import { NextRequest } from "next/server";

import prisma from "prisma/db";
import { handleErrors } from "~/lib/server";

export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		const email = req.nextUrl.searchParams.get("email");
		let user;
		if (email) {
			try {
				user = await prisma.user.findUnique({
					where: { email },
				});
			} catch {
				throw new Error("No user found");
			}

			const member = await prisma.member.findFirst({
				where: { userId: user.id },
				include: { community: true },
			});
			return Response.json({ member, status: 200 });
		} else {
			throw new Error("No email provided");
		}
	});
}
