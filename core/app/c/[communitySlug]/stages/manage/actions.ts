"use server";

import { revalidatePath } from "next/cache";
import { StagePayload } from "~/lib/types";
import prisma from "~/prisma/db";

export async function editStage(patchData: any) {
	const existingMoveDestinations = [
		...new Set(patchData.stage.moveConstraints.map((constraint) => constraint.destinationId)),
	];

	const newMoveDestinations = Object.keys(patchData.newMoveConstraints).filter(
		(id) => patchData.newMoveConstraints[id]
	);
	console.log(
		"\n\n existing move constraints",
		existingMoveDestinations,
		"\n\n new",
		newMoveDestinations,
		"\n\n"
	);

	// Check if the arrays are the same
	const areMoveConstraintsSame =
		JSON.stringify(existingMoveDestinations) === JSON.stringify(newMoveDestinations);

	console.log("areMoveConstraintsSame: ", areMoveConstraintsSame, "\n\n");

	console.log("Old: ", patchData.stage.name, "New: ", patchData.newName);
	try {
		// Begin a transaction
		await prisma.$transaction(async (prisma) => {
			// Update the stage name
			if (patchData.stage.name !== patchData.newName) {
				await prisma.stage.update({
					where: { id: patchData.stage.id },
					data: { name: patchData.newName },
				});
			}

			if (existingMoveDestinations.length > 0 && !areMoveConstraintsSame) {
				// Update and/or delete move constraints
				await Promise.all(
					Object.keys(patchData.newMoveConstraints)
						.filter((x) => {
							return x !== patchData.stage.id;
						})
						.map(async (constraintId) => {
							if (patchData.newMoveConstraints[constraintId]) {
								// If move constraint is checked, update or create
								await prisma.moveConstraint.upsert({
									where: { id: constraintId },
									update: {},
									create: {
										id: constraintId,
										stageId: patchData.stageId,
										destinationId: constraintId,
									},
								});
							} else {
								console.log(
									"Stage ID: ",
									patchData.stage.id,
									"\n",
									"New Move desination ID",
									constraintId,
									"\n"
								);
								const moveConstraint = await prisma.moveConstraint.findFirst({
									where: {
										stage: { id: patchData.stage.id },
										// stageId: patchData.stage.id,
										destinationId: constraintId,
									},
								});
								if (!moveConstraint) {
									return { key: "No constraint found." };
								}
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
