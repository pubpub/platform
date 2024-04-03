"use server";

import { revalidateTag } from "next/cache";
import db from "~/prisma/db";

export async function createStage(communityId: string) {
	try {
		await db.stage.create({
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
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function deleteStages(communityId: string, stageIds: string[]) {
	try {
		await db.stage.deleteMany({
			where: {
				id: {
					in: stageIds,
				},
			},
		});
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function createMoveConstraint(
	communityId: string,
	sourceStageId: string,
	destinationStageId: string
) {
	try {
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
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function deleteMoveConstraints(
	communityId: string,
	moveConstraintIds: [string, string][]
) {
	try {
		const ops = moveConstraintIds.map(([stageId, destinationId]) =>
			db.moveConstraint.delete({
				where: {
					move_constraint_id: {
						stageId,
						destinationId,
					},
				},
			})
		);
		await Promise.all(ops);
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function deleteStagesAndMoveConstraints(
	communityId: string,
	stageIds: string[],
	moveConstraintIds: [string, string][]
) {
	try {
		// Delete move constraints prior to deleting stages to prevent foreign
		// key constraint violations.
		if (moveConstraintIds.length > 0) {
			await deleteMoveConstraints(communityId, moveConstraintIds);
		}
		if (stageIds.length > 0) {
			await deleteStages(communityId, stageIds);
		}
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function updateStageName(communityId: string, stageId: string, name: string) {
	try {
		await db.stage.update({
			where: {
				id: stageId,
			},
			data: {
				name,
			},
		});
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function revalidateStages(communityId: string) {
	revalidateTag(`community-stages_${communityId}`);
}

export async function addAction(communityId: string, stageId: string, actionId: string) {
	try {
		await db.actionInstance.create({
			data: {
				action: {
					connect: {
						id: actionId,
					},
				},
				stage: {
					connect: {
						id: stageId,
					},
				},
			},
		});
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}

export async function deleteAction(communityId: string, actionId: string) {
	try {
		await db.actionInstance.delete({
			where: {
				id: actionId,
			},
		});
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
}
