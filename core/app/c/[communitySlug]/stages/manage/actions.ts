"use server";

import { revalidatePath } from "next/cache";
import prisma from "~/prisma/db";

export const editStage = async (stage: any) => {
	const updatedStage = await prisma.stage.update({
		where: { id: stage.stageId },
		data: {
			name: stage.stageName,
		},
	});
	revalidatePath("/");
	return { key: updatedStage };
};

export const addStageToMoveConstraint = async (from: any, to: any) => {
	const newMoveConstraint = await prisma.moveConstraint.create({
		data: {
			stage: {
				connect: {
					id: to.id,
				},
			},
			destination: {
				connect: {
					id: from.id,
				},
			},
		},
	});
	revalidatePath("/");
	return { key: newMoveConstraint };
};

export const removeStageFromMoveConstraint = async (constraint: any, stage: any) => {
	const updatedStage = await prisma.stage.update({
		where: { id: stage.id },
		data: {
			moveConstraints: {
				disconnect: {
					id: constraint,
				},
			},
		},
	});

	revalidatePath("/");

	return { key: updatedStage };
};
