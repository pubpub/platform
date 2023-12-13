import { NextRequest, NextResponse } from "next/server";
import prisma from "prisma/db";

import { BadRequestError, NotFoundError, handleErrors } from "~/lib/server";

export async function POST(req: NextRequest) {
	return await handleErrors(async () => {
		const { name, order, communityId } = await req.json();

		if (!name) {
			throw new BadRequestError("No email provided");
		}

		if (!order) {
			throw new BadRequestError("No community ID provided");
		}

		const newStage = await prisma.stage.create({
			data: {
				name,
				order,
				communityId,
			},
		});

		return NextResponse.json({ newStage }, { status: 200 });
	});
}
