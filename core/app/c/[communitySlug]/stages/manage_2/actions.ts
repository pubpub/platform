"use server";

import { revalidatePath } from "next/cache";
import db from "~/prisma/db";

export async function createStage(communityId: string) {
	const stage = await db.stage.create({
		data: {
			name: "Untitled Stage",
			order: "aa",
			community: {
				connect: {
					id: communityId,
				},
			},
		},
	});
	revalidatePath("/");
	return stage;
}

export async function deleteStages(stageIds: string[]) {
	await db.stage.deleteMany({
		where: {
			id: {
				in: stageIds,
			},
		},
	});
	revalidatePath("/");
}

export async function createMoveConstraint(sourceStageId: string, destinationStageId: string) {
	await db.moveConstraint.create({
		data: {
			stage: {
				connect: {
					id: sourceStageId,
				},
			},
			destination: {
				connect: {
					id: destinationStageId,
				},
			},
		},
	});
	revalidatePath("/");
}

export async function deleteMoveConstraints(moveConstraintIds: [string, string][]) {
	const ops = moveConstraintIds.map(([sourceStageId, destinationStageId]) => {
		return db.moveConstraint.delete({
			where: {
				move_constraint_id: {
					stageId: sourceStageId,
					destinationId: destinationStageId,
				},
			},
		});
	});
	await Promise.all(ops);
	revalidatePath("/");
}
