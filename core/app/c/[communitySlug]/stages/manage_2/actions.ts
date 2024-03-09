"use server";

import { revalidateTag } from "next/cache";
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
	const ops = moveConstraintIds.map(([stageId, destinationId]) => {
		return db.moveConstraint.delete({
			where: {
				move_constraint_id: {
					stageId,
					destinationId,
				},
			},
		});
	});
	await Promise.all(ops);
	revalidateTag(`community-stages_${communityId}`);
}

export async function deleteStagesAndMoveConstraints(
	communityId: string,
	stageIds: string[],
	moveConstraintIds: [string, string][]
) {
	// Delete move constraints prior to deleting stages to prevent foreign
	// key constraint violations.
	if (moveConstraintIds.length > 0) {
		await deleteMoveConstraints(communityId, moveConstraintIds);
	}
	if (stageIds.length > 0) {
		await deleteStages(communityId, stageIds);
	}
	revalidateTag(`community-stages_${communityId}`);
}

export async function updateStageName(communityId: string, stageId: string, name: string) {
	await db.stage.update({
		where: {
			id: stageId,
		},
		data: {
			name,
		},
	});
	revalidateTag(`community-stages_${communityId}`);
}

export async function revalidateStages(communityId: string) {
	revalidateTag(`community-stages_${communityId}`);
}
