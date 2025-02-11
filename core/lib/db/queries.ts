import { cache } from "react";

import type { StagesId, UsersId } from "db/public";

import type { RuleConfig } from "~/actions/types";
import { db } from "~/kysely/database";
import { pubType, pubValuesByRef } from "../server";
import { autoCache } from "../server/cache/autoCache";
import { viewableStagesCte } from "../server/stages";
import { SAFE_USER_SELECT } from "../server/user";

export const getStage = cache((stageId: StagesId, userId: UsersId) => {
	return autoCache(
		db
			.with("viewableStages", (db) => viewableStagesCte({ db, userId }))
			.selectFrom("stages")
			.innerJoin("viewableStages", "viewableStages.stageId", "stages.id")
			.select([
				"stages.id",
				"communityId",
				"stages.name",
				"stages.order",
				"createdAt",
				"updatedAt",
			])
			.where("stages.id", "=", stageId)
	);
});

export const getStageActions = cache((stageId: StagesId) => {
	return autoCache(db.selectFrom("action_instances").selectAll().where("stageId", "=", stageId));
});

export type StagePub = Awaited<
	ReturnType<ReturnType<typeof getStagePubs>["executeTakeFirstOrThrow"]>
>;

export const getStagePubs = cache((stageId: StagesId) => {
	return autoCache(
		db
			.selectFrom("pubs")
			.selectAll("pubs")
			.select(pubValuesByRef("pubs.id"))
			.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
			.where("pubs.stageId", "=", stageId)
	);
});

export const getStageMembers = cache((stageId: StagesId) => {
	return autoCache(
		db
			.selectFrom("stage_memberships")
			.where("stage_memberships.stageId", "=", stageId)
			.innerJoin("users", "users.id", "stage_memberships.userId")
			.select(SAFE_USER_SELECT)
			.select("stage_memberships.role")
	);
});

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
	);
});
