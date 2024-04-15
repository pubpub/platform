"use server";

import { revalidateTag } from "next/cache";
import { captureException } from "@sentry/nextjs";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import { getActionRunByName } from "~/actions/getRuns";
import { db } from "~/kysely/database";
import { type ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { PubsId } from "~/kysely/types/public/Pubs";
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
	actionId: string
) {
	try {
		await prisma.actionInstance.create({
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

export const updateAction = defineServerAction(async function updateAction(
	communityId: string,
	actionInstanceId: ActionInstancesId,
	config: any
) {
	try {
		await db
			.updateTable("action_instances")
			.set({ config })
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

const pubMap = [
	"id",
	"created_at as createdAt",
	"updated_at as updatedAt",
	"pub_type_id as pubTypeId",
	"community_id as communityId",
	"valuesBlob",
	"parent_id as parentId",
	"assignee_id as assigneeId",
] as const;

export const runAction = defineServerAction(async function runAction({
	pubId,
	actionInstanceId,
}: {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
}) {
	const pub = await db
		.selectFrom("pubs")
		.select(pubMap)
		.where("id", "=", pubId)
		.executeTakeFirst();
	if (!pub) {
		return {
			error: "Pub not found",
		};
	}
	console.log(pub);

	const actionInstance = await db
		.selectFrom("action_instances")
		.where("action_instances.id", "=", actionInstanceId)
		.select((eb) => [
			"id",
			"config",
			"created_at as createdAt",
			"updated_at as updatedAt",
			"stage_id as stageId",
			"action_id as actionId",
			jsonObjectFrom(
				eb
					.selectFrom("actions")
					.selectAll()
					.select([
						"actions.id",
						"actions.name",
						"actions.created_at as createdAt",
						"actions.updated_at as updatedAt",
						"actions.description",
					])
					.whereRef("actions.id", "=", "action_instances.action_id")
			).as("action"),
		])
		.executeTakeFirst();

	console.log("aaa", actionInstance);

	if (!actionInstance) {
		return {
			error: "Action instance not found",
		};
	}

	if (!actionInstance.action) {
		return {
			error: "Action not found",
		};
	}

	const action = await getActionRunByName(actionInstance.action.name);
	//	const action = getActionRunFunctionByName(actionInstance.action.name);

	if (!action) {
		return {
			error: "Action not found",
		};
	}
	console.log("values", pub.valuesBlob);

	try {
		const result = await action({
			config: {},
			pub: {
				id: pubId,
				values: JSON.parse(pub.valuesBlob),
			},
			pubConfig: {},
		});

		return result;
	} catch (error) {
		captureException(error);
		return {
			title: "Failed to run action",
			error: error.message,
		};
	}
});
