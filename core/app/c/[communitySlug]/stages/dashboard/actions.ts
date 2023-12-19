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
