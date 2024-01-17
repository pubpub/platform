"use server";

import { revalidatePath } from "next/cache";
import prisma from "~/prisma/db";

export async function editStage(patchData: any) {
	try {
		const existingMoveDestinations = [
			...new Set(
				patchData.stage.moveConstraints.map((constraint) => constraint.destinationId)
			),
		];

		const newMoveDestinations = Object.keys(patchData.newMoveConstraints).filter(
			(id) => patchData.newMoveConstraints[id]
		);

		// Check if the arrays are the same
		const areMoveConstraintsSame =
			JSON.stringify(existingMoveDestinations) === JSON.stringify(newMoveDestinations);

		const moveConstraint = await prisma.moveConstraint.findFirst({
			where: {
				stageId: patchData.stage.id,
			},
		});
		if (!moveConstraint) {
			return { error: "Move constraint not found" };
		}
		console.log("Move constraint: ", moveConstraint);
		// Begin a transaction to update stage name and move constarints
		await prisma.$transaction(async (prisma) => {
			if (patchData.stage.name !== patchData.newName) {
				await prisma.stage.update({
					where: { id: patchData.stage.id },
					data: { name: patchData.newName },
				});
			}

			if (!areMoveConstraintsSame) {
				// Update/create and/or delete move constraints
				await Promise.all(
					Object.keys(patchData.newMoveConstraints)
						.filter((x) => {
							return x !== patchData.stage.id;
						})
						.map(async (destinationId) => {
							if (patchData.newMoveConstraints[destinationId]) {
								// If move constraint is checked, update or create
								await prisma.moveConstraint.upsert({
									where: { id: moveConstraint.id },
									update: {
										stageId: patchData.stageId,
										destinationId: destinationId,
									},
									create: {
										id: moveConstraint.id,
										stageId: patchData.stageId,
										destinationId: destinationId,
									},
								});
							} else {
								console.log(
									"Stage ID: ",
									patchData.stage.id,
									"\n",
									"New Move desination ID",
									destinationId,
									"\n"
								);

								console.log("Move constraint: ", moveConstraint);
								// If move constraint is unchecked, delete
								// await prisma.moveConstraint.delete({
								// 	where: { id: moveConstraint.id },
								// });
							}
						})
				);
			}
		});

		revalidatePath("/");
		return { success: "Stage and move constraints updated successfully" };
	} catch (error) {
		return { error: `Error updating stage and move constraints: ${error}` };
	} finally {
		// Disconnect Prisma client
		await prisma.$disconnect();
	}
}
