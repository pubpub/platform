import { cache } from "react";
import { expect } from "utils";
import prisma from "~/prisma/db";

export const getActions = cache(async () => {
	return await prisma.action.findMany();
});

export const getStage = cache(async (stageId: string) => {
	return await prisma.stage.findUnique({
		where: { id: stageId },
	});
});

export const getStageActions = cache(async (stageId: string) => {
	return await prisma.actionInstance.findMany({
		where: {
			stageId,
		},
		include: {
			action: true,
		},
	});
});

export const getStagePubs = cache(async (stageId: string) => {
	return await prisma.pub.findMany({
		where: {
			stages: {
				some: { id: stageId },
			},
		},
	});
});

export const getStageMembers = cache(async (stageId: string) => {
	const permissions = await prisma.permission.findMany({
		where: {
			stages: {
				some: { id: stageId },
			},
		},
		include: {
			memberGroup: {
				include: {
					users: true,
				},
			},
		},
	});

	const members = permissions.reduce((acc, permission) => {
		if (permission.memberGroup !== null) {
			for (const user of permission.memberGroup.users) {
				acc.add(user.id);
			}
		} else {
			acc.add(expect(permission.memberId));
		}
		return acc;
	}, new Set<string>());

	return members;
});
