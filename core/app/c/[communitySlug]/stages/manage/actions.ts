"use server";

import { revalidateTag } from "next/cache";

import type Action from "~/kysely/types/public/Action";
import { db } from "~/kysely/database";
import { type ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { defineServerAction } from "~/lib/server/defineServerAction";
import prisma from "~/prisma/db";

async function deleteStages(stageIds: string[]) {
	await prisma.stage.deleteMany({
		where: {
			id: {
				in: stageIds,
			},
		},
	});
}

async function deleteMoveConstraints(moveConstraintIds: [string, string][]) {
	const ops = moveConstraintIds.map(([stageId, destinationId]) =>
		prisma.moveConstraint.delete({
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
		await prisma.stage.create({
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
		await prisma.stage.delete({
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
		await prisma.moveConstraint.create({
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
		await prisma.stage.update({
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
	actionName: Action
) {
	try {
		await prisma.actionInstance.create({
			data: {
				name: actionName,
				action: actionName,
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

export const updateAction = defineServerAction(async function updateAction(
	communityId: string,
	actionInstanceId: ActionInstancesId,
	props:
		| {
				config: Record<string, any>;
				name?: undefined;
		  }
		| { name: string; config?: undefined }
) {
	try {
		await db
			.updateTable("action_instances")
			.set(props.name ? { name: props.name } : { config: props.config })
			.where("id", "=", actionInstanceId)
			.executeTakeFirstOrThrow();
	} finally {
		revalidateTag(`community-stages_${communityId}`);
	}
});

export const deleteAction = defineServerAction(async function deleteAction(
	communityId: string,
	actionId: string
) {
	try {
		await prisma.actionInstance.delete({
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
