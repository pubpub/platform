import { cache } from "react"
import { jsonObjectFrom } from "kysely/helpers/postgres"

import type { StagesId } from "db/public"

import type { RuleConfig } from "~/actions/types"
import { db } from "~/kysely/database"
import prisma from "~/prisma/db"
import { pubType, pubValuesByRef } from "../server"
import { communityMemberInclude, stageInclude } from "../server/_legacy-integration-queries"
import { autoCache } from "../server/cache/autoCache"
import { SAFE_USER_SELECT } from "../server/user"

export const getStage = cache((stageId: StagesId) => {
	return autoCache(
		db
			.selectFrom("stages")
			.select([
				"stages.id",
				"communityId",
				"stages.name",
				"stages.order",
				"createdAt",
				"updatedAt",
			])
			.where("stages.id", "=", stageId)
	)
})

export const getStageActions = cache((stageId: StagesId) => {
	return autoCache(db.selectFrom("action_instances").selectAll().where("stageId", "=", stageId))
})

export type StagePub = Awaited<
	ReturnType<ReturnType<typeof getStagePubs>["executeTakeFirstOrThrow"]>
>

export const getStagePubs = cache((stageId: StagesId) => {
	return autoCache(
		db
			.selectFrom("pubs")
			.selectAll("pubs")
			.select(pubValuesByRef("pubs.id"))
			.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
			.innerJoin("PubsInStages", "PubsInStages.pubId", "pubs.id")
			.where("PubsInStages.stageId", "=", stageId)
	)
})

export const getStageMembers = cache((stageId: StagesId) => {
	return autoCache(
		db
			.selectFrom("stage_memberships")
			.where("stage_memberships.stageId", "=", stageId)
			.innerJoin("users", "users.id", "stage_memberships.userId")
			.select(SAFE_USER_SELECT)
			.select("stage_memberships.role")
	)
})

export const getStageRules = cache((stageId: string) => {
	return autoCache(
		db
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
	)
})

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
	})
}
