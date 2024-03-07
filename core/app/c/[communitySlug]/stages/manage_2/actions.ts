"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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
	revalidateTag(`community-stages_${communityId}`);
	return stage;
}

export async function deleteStages(communityId: string, stageIds: string[]) {
	await db.stage.deleteMany({
		where: {
			id: {
				in: stageIds,
			},
		},
	});
	revalidateTag(`community-stages_${communityId}`);
}

export async function createMoveConstraint(
	communityId: string,
	sourceStageId: string,
	destinationStageId: string
) {
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
	revalidateTag(`community-stages_${communityId}`);
}

export async function deleteMoveConstraints(
	communityId: string,
	moveConstraintIds: [string, string][]
) {
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
	revalidateTag(`community-stages_${communityId}`);
}
