import { NextRequest, NextResponse } from "next/server";
import prisma from "prisma/db";

import { BadRequestError, handleErrors } from "~/lib/server";

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

export async function PUT(req: NextRequest) {
	return await handleErrors(async () => {
		const { stageName, stageId } = await req.json();
		console.log("\n\nstageName\n\n", stageName);
		console.log("\n\nstageId\n\n", stageId);

		// if (!stageId) {
		// 	throw new BadRequestError("No ID provided");
		// }
		// if (!stageName) {
		// 	throw new BadRequestError("No email provided");
		// }

		// const updatedStage = await prisma.stage.update({
		// 	where: { id: stageId },
		// 	data: {
		// 		name: stageName,
		// 	},
		// });

		return NextResponse.json({ updatedStage: "no" }, { status: 200 });
	});
}
