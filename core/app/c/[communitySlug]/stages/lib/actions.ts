"use server";
import { expect } from "utils";
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
		return { message: "The Pub was not successully moved" };
	}
}

export async function assign(pubId: string, userId: string, stageId: string) {
	try {
		const pub = await prisma.pub.findUnique({
			where: { id: pubId },
			include: { claims: true },
		});
		if (expect(pub).claims.find((claim) => claim.userId === userId)) {
			return { message: "User already assigned" };
		}
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
		return { message: "The Pub was not successully assigned" };
	}
}
