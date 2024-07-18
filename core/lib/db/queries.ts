import type { User } from "@prisma/client";

import { cache } from "react";

import type { StagesId } from "db/public";
import { Rules } from "db/public";
import { expect } from "utils";

import { RuleConfig, RuleConfigs } from "~/actions/types";
import { db } from "~/kysely/database";
import { communityMemberInclude, pubValuesInclude, stageInclude } from "~/lib/types";
import prisma from "~/prisma/db";

export const getStage = cache(async (stageId: string) => {
	return await db
		.selectFrom("stages")
		.select([
			"stages.id",
			"communityId",
			"stages.name",
			"stages.order",
			"createdAt",
			"updatedAt",
		])
		.where("stages.id", "=", stageId as StagesId)
		.executeTakeFirst();
});

export const getStageActions = cache(async (stageId: string) => {
	return await db
		.selectFrom("action_instances")
		.selectAll()
		.where("stageId", "=", stageId as StagesId)
		.execute();
});

export type StagePub = Awaited<ReturnType<typeof getStagePubs>>[number];

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
		.where("stageId", "=", stageId as StagesId)
		.innerJoin("rules", "rules.actionInstanceId", "action_instances.id")
		.select([
			"rules.id",
			"rules.event",
			"rules.config",
			"action_instances.name as instanceName",
			"action_instances.action",
			"actionInstanceId",
		])
		.$narrowType<{ config: RuleConfig | null }>()
		.execute();
	return rules;
});

export const getCommunityBySlug = async (communitySlug: string) => {
	return await prisma.community.findUnique({
		where: { slug: communitySlug },
		include: {
			stages: {
				include: stageInclude,
			},
			members: {
				include: communityMemberInclude,
			},
		},
	});
};
