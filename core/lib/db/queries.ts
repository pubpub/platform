import { cache } from "react";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { ActionInstancesId, CommunitiesId, PubsId, StagesId, UsersId } from "db/public";
import { Event } from "db/public";

import type { XOR } from "../types";
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

export const getStageActions = cache(
	({
		stageId,
		communityId,
		pubId,
	}:
		| {
				stageId: StagesId;
				communityId?: never;
				pubId?: never;
		  }
		| {
				communityId: CommunitiesId;
				stageId?: never;
				pubId?: never;
		  }
		| {
				pubId: PubsId;
				stageId?: never;
				communityId?: never;
		  }) => {
		return autoCache(
			db
				.selectFrom("action_instances")
				.select([
					"action_instances.id",
					"action_instances.action",
					"action_instances.config",
					"action_instances.name",
					"action_instances.createdAt",
					"action_instances.stageId",
					"action_instances.updatedAt",
				])
				.select((eb) =>
					jsonObjectFrom(
						eb
							.selectFrom("action_runs")
							.selectAll("action_runs")
							.whereRef("action_runs.actionInstanceId", "=", "action_instances.id")
							.orderBy("action_runs.createdAt", "desc")
							.limit(1)
					).as("lastActionRun")
				)
				.innerJoin("stages", "action_instances.stageId", "stages.id")
				.$if(!!pubId, (eb) =>
					eb
						.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
						.where("PubsInStages.pubId", "=", pubId!)
				)
				.$if(!!stageId, (eb) => eb.where("stageId", "=", stageId!))
				.$if(!!communityId, (eb) => eb.where("stages.communityId", "=", communityId!))
		);
	}
);

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
			.innerJoin("PubsInStages", "PubsInStages.pubId", "pubs.id")
			.where("PubsInStages.stageId", "=", stageId)
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
			.orderBy("stage_memberships.createdAt asc")
	);
});

export type GetEventRuleOptions =
	| {
			event: Event.pubInStageForDuration;
			sourceActionInstanceId?: never;
	  }
	| {
			event: Event.actionFailed | Event.actionSucceeded;
			sourceActionInstanceId: ActionInstancesId;
	  };
export const getStageRules = cache((stageId: StagesId, options?: GetEventRuleOptions) => {
	return autoCache(
		db
			.selectFrom("rules")
			.innerJoin("action_instances as ai", "ai.id", "rules.actionInstanceId")
			.where("ai.stageId", "=", stageId)
			.select((eb) => [
				"rules.id",
				"rules.event",
				"rules.config",
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.selectAll("action_instances")
						.whereRef("action_instances.id", "=", "rules.actionInstanceId")
				)
					.$notNull()
					.as("actionInstance"),
				"sourceActionInstanceId",
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.selectAll("action_instances")
						.whereRef("action_instances.id", "=", "rules.sourceActionInstanceId")
					// .where("action_instances.stageId", "=", stageId)
				).as("sourceActionInstance"),
			])
			.$if(!!options?.event, (eb) => {
				const where = eb.where("rules.event", "=", options!.event);

				if (options!.event === Event.pubInStageForDuration) {
					return where;
				}

				return where.where(
					"rules.sourceActionInstanceId",
					"=",
					options!.sourceActionInstanceId
				);
			})
			.$narrowType<{ config: RuleConfig | null }>()
	);
});

// export const getReferentialRules = cache(
// 	(stageId: StagesId, event: Event, sourceActionInstanceId: ActionInstancesId) => {
// 		return autoCache(
// 			getStageRules(stageId)
// 				.qb.where("rules.sourceActionInstanceId", "=", sourceActionInstanceId)
// 				.where("rules.event", "=", event)
// 		);
// 	}
// );
