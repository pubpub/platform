"use server";

import { revalidateTag } from "next/cache";
import { defineServerAction } from "~/lib/server/defineServerAction";
import db from "~/prisma/db";

async function deleteStages(stageIds: string[]) {
	await db.stage.deleteMany({
		where: {
			id: {
				in: stageIds,
			},
		},
	});
}

async function deleteMoveConstraints(moveConstraintIds: [string, string][]) {
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
}

export const createStage = defineServerAction(async function createStage(communityId: string) {
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
	} catch (error) {
		return {
			error: "Failed to create stage",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const deleteStage = defineServerAction(async function deleteStage(
	communityId: string,
	stageId: string
) {
	try {
		await db.stage.delete({
			where: {
				id: stageId,
			},
		});
	} catch (error) {
		return {
			error: "Failed to delete stage",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const createMoveConstraint = defineServerAction(async function createMoveConstraint(
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
	} catch (error) {
		return {
			error: "Failed to connect stages",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const deleteStagesAndMoveConstraints = defineServerAction(
	async function deleteStagesAndMoveConstraints(
		communityId: string,
		stageIds: string[],
		moveConstraintIds: [string, string][]
	) {
		try {
			// Delete move constraints prior to deleting stages to prevent foreign
			// key constraint violations.
			if (moveConstraintIds.length > 0) {
				await deleteMoveConstraints(moveConstraintIds);
			}
			if (stageIds.length > 0) {
				await deleteStages(stageIds);
			}
		} catch (error) {
			return {
				error: "Failed to delete stages and/or connections",
				cause: error,
			};
		} finally {
			revalidateTag(`community-stages_${communityId}`);
		}
	}
);

export const updateStageName = defineServerAction(async function updateStageName(
	communityId: string,
	stageId: string,
	name: string
) {
	try {
		await db.stage.update({
			where: {
				id: stageId,
			},
			data: {
				name,
			},
		});
	} catch (error) {
		return {
			error: "Failed to update stage name",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const revalidateStages = defineServerAction(async function revalidateStages(
	communityId: string
) {
	revalidateTag(`community-stages_${communityId}`);
});

export const addAction = defineServerAction(async function addAction(
	communityId: string,
	stageId: string,
	actionId: string
) {
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
	} catch (error) {
		return {
			error: "Failed to add action",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const deleteAction = defineServerAction(async function deleteAction(
	communityId: string,
	actionId: string
) {
	try {
		await db.actionInstance.delete({
			where: {
				id: actionId,
			},
		});
	} catch (error) {
		return {
			error: "Failed to delete action",
			cause: error,
		};
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});
