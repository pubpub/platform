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

export const addStageToMoveConstraint = async (constraint: any, stage: any) => {
	const newMoveConstraint = await prisma.moveConstraint.create({
		data: {
			stage: {
				connect: {
					id: stage.id,
				},
			},
			destination: {
				connect: {
					id: stage.id,
				},
			},
		},
	});
	const updatedStage = await prisma.stage.update({
		where: { id: stage.id },
		data: {
			moveConstraints: {
				connect: {
					id: newMoveConstraint.id,
				},
			},
		},
	});
	revalidatePath("/");
	return { key: "add here" };
};

export const removeStageFromMoveConstraint = async (constraint: any, stage: any) => {
	// const updatedStage = await prisma.stage.update({
	// 	where: { id: stage.stageId },
	// 	data: {
	// 		moveConstraints: {
	// 			disconnect: {
	// 				id: stage.constraintId,
	// 			},
	// 		},
	// 	},
	// });
	// revalidatePath("/");

	return { key: "removal here" };
};
