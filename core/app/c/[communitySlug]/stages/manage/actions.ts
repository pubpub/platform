"use server";

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

export async function addMoveConstraint(from: StagePayload, to: StagePayload): Promise<unknown> {
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
		return { success: "succesfully added constraint" };
	} catch (e) {
		console.log(e);
		return { error: e };
	}
}

export async function removeMoveConstraint(
	constraint: StagePayload,
	from: StagePayload
): Promise<unknown> {
	try {
		// I think wqe need to disconnect the contraint from the stage then delete it from the DB
		// but that doesn't seem to work

		// //disconnect stage from constraint
		// await prisma.stage.update({
		// 	where: {
		// 		id: from.id,
		// 	},
		// 	data: {
		// 		moveConstraints: {
		// 			disconnect: {
		// 				id: constraintToRemove.id,
		// 			},
		// 		},
		// 	},
		// });

		await prisma.moveConstraint.delete({
			where: { id: constraint.id },
		});

		revalidatePath("/");

		return { key: "success" };
	} catch (error) {
		console.log(error);
		return { key: error };
	}
}
