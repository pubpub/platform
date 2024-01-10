"use server";

import { error } from "console";
import { revalidatePath } from "next/cache";
import { StagePayload } from "~/lib/types";
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

export async function addMoveConstraint(
	from: StagePayload,
	to: StagePayload
): Promise<{ success?: string; error?: string }> {
	try {
		await prisma.moveConstraint.create({
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
		return { success: `Successfully added ${to.name} to ${from.name}` };
	} catch (e) {
		console.log(e);
		return { error: e };
	}
}

export async function removeMoveConstraint(
	stageToRemove: StagePayload,
	from: StagePayload
): Promise<{ success?: string; error?: string }> {
	try {
		// find move constraint given the stage
		const moveConstraint = await prisma.moveConstraint.findFirst({
			where: {
				stageId: from.id,
				destinationId: stageToRemove.id,
			},
		});

		if (!moveConstraint) {
			return { error: "No constraint found." };
		}
		await prisma.moveConstraint.delete({
			where: { id: moveConstraint.id },
		});

		revalidatePath("/");

		return { success: `Successfully removed ${stageToRemove.name} from ${from.name}` };
	} catch (e) {
		console.log(e);
		return { error: e };
	}
}
