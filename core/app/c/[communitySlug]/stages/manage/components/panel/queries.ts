import type { User } from "@prisma/client";

import { cache } from "react";

import { expect } from "utils";

import { db } from "~/kysely/database";
import { StagesId } from "~/kysely/types/public/Stages";
import prisma from "~/prisma/db";

export const getStage = cache(async (stageId: string) => {
	const fields = [
		"stages.id",
		"stages.community_id as communityId",
		"stages.name",
		"stages.order",
		"stages.created_at as createdAt",
		"stages.updated_at as updatedAt",
	] as const;
	return await db
		.selectFrom("stages")
		.select(fields)
		.where("stages.id", "=", stageId as StagesId)
		.executeTakeFirst();
});

export const getStageActions = cache(async (stageId: string) => {
	return await prisma.actionInstance.findMany({
		where: {
			stageId,
		},
	});
});

export const getStagePubs = cache(async (stageId: string) => {
	return await prisma.pub.findMany({
		where: {
			stages: {
				some: { stage: { id: stageId } },
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
			member: {
				include: {
					user: true,
				},
			},
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
				acc.set(user.id, user);
			}
		} else {
			const user = expect(permission.member).user;
			acc.set(user.id, user);
		}
		return acc;
	}, new Map<string, User>());

	return members;
});
