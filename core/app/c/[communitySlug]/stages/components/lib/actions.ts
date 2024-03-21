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
					disconnect: { id: sourceStageId },
					connect: { id: destinationStageId },
				},
			},
		});
		revalidatePath("/");
	} catch {
		return { message: "The Pub was not successully moved" };
	}
}

export async function assign(pubId: string, stageId: string, userId?: string) {
	try {
		// TODO(eric+kalil): make this less hacky once we have only one asignee per-pub
		// Delete all claims for the Pub since we are committing to one assignee per-pub
		await prisma.pub.update({
			where: { id: pubId },
			data: {
				claims: {
					deleteMany: {},
				},
			},
		});
		if (userId) {
			// Add the new claim
			await prisma.pub.update({
				where: { id: pubId },
				data: {
					claims: {
						create: {
							stageId,
							userId,
						},
					},
				},
			});
		}
	} catch {
		return { message: "The Pub was not successully assigned" };
	}
}
