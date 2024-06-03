import type { User } from "@prisma/client";

import { cache } from "react";

import { expect } from "utils";

import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import { pubValuesInclude } from "~/lib/types";
import prisma from "~/prisma/db";

export const getStage = cache(async (stageId: string) => {
	return await db
		.selectFrom("stages")
		.select([
			"stages.id",
			"stages.community_id as communityId",
			"stages.name",
			"stages.order",
			"stages.created_at as createdAt",
			"stages.updated_at as updatedAt",
		])
		.where("stages.id", "=", stageId as StagesId)
		.executeTakeFirst();
});

export const getStageActions = cache(async (stageId: string) => {
	return await db
		.selectFrom("action_instances")
		.selectAll()
		.where("stage_id", "=", stageId as StagesId)
		.execute();
});

export const getStagePubs = cache(async (stageId: string) => {
	return await prisma.pub.findMany({
		where: {
			stages: {
				some: { stage: { id: stageId } },
			},
		},
		include: pubValuesInclude,
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

export const getStageRules = cache(async (stageId: string) => {
	const rules = await db
		.selectFrom("action_instances")
		.where("stage_id", "=", stageId as StagesId)
		.innerJoin("rules", "rules.action_instance_id", "action_instances.id")
		.select([
			"rules.id",
			"rules.event",
			"rules.config",
			"action_instances.name as instanceName",
			"action_instances.action",
			"action_instance_id as actionInstanceId",
		])
		.execute();
	return rules;
});
