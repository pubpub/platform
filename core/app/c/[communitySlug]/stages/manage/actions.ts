"use server";

import { revalidatePath } from "next/cache";
import { StageFormSchema } from "~/lib/stages";
import prisma from "~/prisma/db";

export async function editStage(stageId: string, patchData: StageFormSchema) {
	try {
		console.log("editStage", stageId, patchData);
		const entries = Object.entries(patchData.moveConstraints);
		const deleteMany = entries
			// filters out destinationIds that are true(checked)
			.filter(([, value]) => !value)
			// creates an array of objects used to delete move constraints
			.map(([key]) => ({ destinationId: key, stageId }));

		const connectOrCreate = entries
			.filter(([, value]) => value)
			.map(([key]) => ({
				where: { move_constraint_id: { stageId, destinationId: key } },
				create: { destinationId: key },
			}));

		await prisma.stage.update({
			where: { id: stageId },
			data: {
				name: patchData.name,
				moveConstraints: {
					connectOrCreate,
					deleteMany,
				},
			},
		});
		revalidatePath("/");
		return { success: "Stage and move constraints updated successfully" };
	} catch (error) {
		return { error: `Error updating stage and move constraints: ${error}` };
	}
}
