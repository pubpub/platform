"use server";

import { withServerActionInstrumentation } from "@sentry/nextjs";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import db from "~/prisma/db";

export async function createStage(communityId: string) {
	return withServerActionInstrumentation(
		"stages/manage/createStage",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function deleteStages(communityId: string, stageIds: string[]) {
	return withServerActionInstrumentation(
		"stages/manage/deleteStages",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function createMoveConstraint(
	communityId: string,
	sourceStageId: string,
	destinationStageId: string
) {
	return withServerActionInstrumentation(
		"stages/manage/createMoveConstraint",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function deleteMoveConstraints(
	communityId: string,
	moveConstraintIds: [string, string][]
) {
	return withServerActionInstrumentation(
		"stages/manage/deleteMoveConstraints",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function deleteStagesAndMoveConstraints(
	communityId: string,
	stageIds: string[],
	moveConstraintIds: [string, string][]
) {
	return withServerActionInstrumentation(
		"stages/manage/deleteStagesAndMoveConstraints",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function updateStageName(communityId: string, stageId: string, name: string) {
	return withServerActionInstrumentation(
		"stages/manage/updateStageName",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function revalidateStages(communityId: string) {
	return withServerActionInstrumentation(
		"stages/manage/revalidateStages",
		{
			headers: headers(),
		},
		async () => {
			revalidateTag(`community-stages_${communityId}`);
		}
	);
}

export async function addAction(communityId: string, stageId: string, actionId: string) {
	return withServerActionInstrumentation(
		"stages/manage/addAction",
		{
			headers: headers(),
		},
		async () => {
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
	);
}

export async function deleteAction(communityId: string, actionId: string) {
	return withServerActionInstrumentation(
		"stages/manage/deleteAction",
		{
			headers: headers(),
		},
		async () => {
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
	);
}
