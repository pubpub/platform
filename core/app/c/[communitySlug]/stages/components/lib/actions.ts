"use server";

import { revalidatePath } from "next/cache";

import prisma from "~/prisma/db";

export async function move(pubId: string, sourceStageId: string, destinationStageId: string) {
	try {
		await prisma.pub.update({
			where: { id: pubId },
			include: { stages: true },
			data: {
				stages: {
					delete: { pubId_stageId: { stageId: sourceStageId, pubId } },
					create: { stageId: destinationStageId },
				},
			},
		});
		revalidatePath("/");
	} catch {
		return { message: "The Pub was not successully moved" };
	}
}

export async function assign(pubId: string, userId?: string) {
	try {
		if (userId) {
			await prisma.pub.update({
				where: { id: pubId },
				data: {
					assignee: {
						connect: {
							id: userId,
						},
					},
				},
			});
		} else {
			await prisma.pub.update({
				where: { id: pubId },
				data: {
					assignee: {
						disconnect: true,
					},
				},
			});
		}
	} catch {
		return { message: "The Pub was not successully assigned" };
	}
}
