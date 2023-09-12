"use server";
import prisma from "~/prisma/db";

export async function move(pubId: string, sourceStageId: string, destinationStageId: string) {
	try {
		await prisma.pub.update({
			where: { id: pubId },
			include: { stages: true },
			data: {
				stages: {
					disconnect: { id: sourceStageId },
					connect: { id: destinationStageId },
				},
			},
		});
	} catch {
		return { error: "Something went wrong" };
	}
}

export async function assign(pubId: string, userId: string, stageId: string) {
	try {
		await prisma.pub.update({
			where: { id: pubId },
			include: { claims: true },
			data: {
				claims: {
					create: {
						stageId: stageId,
						userId: userId,
					},
				},
			},
		});
	} catch {
		return { error: "Something went wrong" };
	}
}
