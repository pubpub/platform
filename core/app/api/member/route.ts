import { NextRequest, NextResponse } from "next/server";

import prisma from "prisma/db";
import { BadRequestError, NotFoundError, handleErrors } from "~/lib/server";

export async function GET(req: NextRequest) {
	return await handleErrors(async () => {
		const email = req.nextUrl.searchParams.get("email");
		if (!email) {
			throw new BadRequestError("No email provided");
		}

		const user = await prisma.user.findUnique({
			where: { email },
			include: {
				memberships: {
					take: 1,
					include: {
						community: true,
					},
				},
			},
		});
		const member = user?.memberships[0];
		if (member) {
			return NextResponse.json({ member }, { status: 200 });
		}

		if (user && !user.memberships.length) {
			throw new NotFoundError("User has no memberships");
		}

		throw new NotFoundError("User not found");
	});
}
