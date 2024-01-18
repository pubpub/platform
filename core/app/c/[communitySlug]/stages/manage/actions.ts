"use server";

import { revalidatePath } from "next/cache";
import { StageFormSchema } from "~/lib/stages";
import { Prisma } from "@prisma/client";
import prisma from "~/prisma/db";
import { DeepPartial } from "~/lib/types";

export async function editStage(stageId: string, patchData: DeepPartial<StageFormSchema>) {
	try {
		const stageUpdateData: Prisma.StageUpdateArgs["data"] = {};
		if (patchData.name) {
			stageUpdateData.name = patchData.name;
		}
		if (patchData.moveConstraints) {
			const entries = Object.entries(patchData.moveConstraints);
			stageUpdateData.moveConstraints = {
				connectOrCreate: entries
					.filter(([, value]) => value)
					.map(([key]) => ({
						where: { move_constraint_id: { stageId, destinationId: key } },
						create: { destinationId: key },
					})),
				deleteMany: entries
					.filter(([, value]) => !value)
					.map(([key]) => ({ destinationId: key, stageId })),
			};
		}

		await prisma.stage.update({
			where: { id: stageId },
			data: stageUpdateData,
		});
		revalidatePath("/");
		return { success: "Stage and move constraints updated successfully" };
	} catch (error) {
		console.log(error);
		return { error: `Error updating stage and move constraints: ${error}` };
	}
}
