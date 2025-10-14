import { cache } from "react";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type { ActionInstancesId, CommunitiesId, PubsId, StagesId, UsersId } from "db/public";
import { Event } from "db/public";
import { logger } from "logger";

import type { RuleConfig } from "~/actions/types";
import { db } from "~/kysely/database";
import { pubType, pubValuesByRef } from "../server";
import { autoCache } from "../server/cache/autoCache";
import { actionConfigDefaultsSelect, viewableStagesCte } from "../server/stages";
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
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.stageId", "=", "stages.id")
						.innerJoin("stages as s", "s.id", "move_constraint.destinationId")
						.select(["s.id", "s.name"])
				).as("moveConstraints"),
				jsonArrayFrom(
					eb
						.selectFrom("move_constraint")
						.whereRef("move_constraint.destinationId", "=", "stages.id")
						.innerJoin("stages as s", "s.id", "move_constraint.stageId")
						.select(["s.id", "s.name"])
				).as("moveConstraintSources"),
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
				.select((eb) => actionConfigDefaultsSelect(eb).as("defaultedActionConfigKeys"))
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
			.select("stage_memberships.formId")
			.orderBy("stage_memberships.createdAt asc")
	);
});

export type GetEventRuleOptions =
	| {
			event: Event.pubInStageForDuration | Event.webhook;
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
			.selectAll("rules")
			.select((eb) => [
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.selectAll("action_instances")
						.whereRef("action_instances.id", "=", "rules.actionInstanceId")
				)
					.$notNull()
					.as("actionInstance"),
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

				if (
					options!.event === Event.pubInStageForDuration ||
					options!.event === Event.webhook
				) {
					return where;
				}

				if (!options!.sourceActionInstanceId) {
					logger.warn({
						msg: `Source action instance id is not set for rule with event ${options!.event}`,
						event: options!.event,
						ruleId: options!.sourceActionInstanceId,
					});
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
