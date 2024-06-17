"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { revalidateTagsForCommunity } from "~/lib/server/cache/revalidate";
import prisma from "~/prisma/db";

export async function move(
	pubId: string,
	sourceStageId: string,
	destinationStageId: string,
	communityId: string
) {
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
		// TODO: Remove this when the above query is replaced by an
		// autoRevalidated kyseley query
		revalidateTagsForCommunity(["PubsInStages"]);
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
		revalidateTagsForCommunity(["pubs"]);
	} catch {
		return { message: "The Pub was not successully assigned" };
	}
}
