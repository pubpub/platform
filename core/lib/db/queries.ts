import { cache } from "react";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	AutomationConditionBlocks,
	AutomationConditions,
	AutomationsId,
	StagesId,
	UsersId,
} from "db/public";
import { AutomationEvent } from "db/public";

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

// export const getStageAutomations = cache(
// 	({
// 		stageId,
// 		communityId,
// 		pubId,
// 	}:
// 		| {
// 				stageId: StagesId;
// 				communityId?: never;
// 				pubId?: never;
// 		  }
// 		| {
// 				communityId: CommunitiesId;
// 				stageId?: never;
// 				pubId?: never;
// 		  }
// 		| {
// 				pubId: PubsId;
// 				stageId?: never;
// 				communityId?: never;
// 		  }) => {
// 		return autoCache(
// 			db
// 				.selectFrom("automations")
// 				.select([
// 					"action_instances.id",
// 					"action_instances.automationId",
// 					"action_instances.config",
// 					"action_instances.name",
// 					"action_instances.createdAt",
// 					"action_instances.stageId",
// 					"action_instances.updatedAt",
// 				])
// 				.select((eb) =>
// 					jsonObjectFrom(
// 						eb
// 							.selectFrom("action_runs")
// 							.selectAll("action_runs")
// 							.whereRef("action_runs.actionInstanceId", "=", "action_instances.id")
// 							.orderBy("action_runs.createdAt", "desc")
// 							.limit(1)
// 					).as("lastActionRun")
// 				)
// 				.innerJoin("stages", "action_instances.stageId", "stages.id")
// 				.select((eb) => actionConfigDefaultsSelect(eb).as("defaultedActionConfigKeys"))
// 				.$if(!!pubId, (eb) =>
// 					eb
// 						.innerJoin("PubsInStages", "PubsInStages.stageId", "stages.id")
// 						.where("PubsInStages.pubId", "=", pubId!)
// 				)
// 				.$if(!!stageId, (eb) => eb.where("stageId", "=", stageId!))
// 				.$if(!!communityId, (eb) => eb.where("stages.communityId", "=", communityId!))
// 		);
// 	}
// );

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

export type GetEventAutomationOptions =
	| {
			event:
				| AutomationEvent.pubInStageForDuration
				| AutomationEvent.webhook
				| AutomationEvent.manual;
			sourceAutomationId?: never;
	  }
	| {
			event: AutomationEvent.automationFailed | AutomationEvent.automationSucceeded;
			sourceAutomationId: AutomationsId;
	  };

export type ConditionBlock = AutomationConditionBlocks & {
	kind: "block";
	items: (ConditionBlock | (AutomationConditions & { kind: "condition" }))[];
};

const getAutomationBase = cache((options?: GetEventAutomationOptions) => {
	return db
		.selectFrom("automations")
		.select([
			"automations.id",
			"automations.name",
			"automations.stageId",
			"automations.createdAt",
			"automations.updatedAt",
		])
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("automation_triggers")
					.selectAll("automation_triggers")
					.whereRef("automation_triggers.automationId", "=", "automations.id")
					.$if(!!options?.event, (qb) =>
						qb.where("automation_triggers.event", "=", options!.event)
					)
					.$if(!!options?.sourceAutomationId, (qb) =>
						qb.where(
							"automation_triggers.sourceAutomationId",
							"=",
							options!.sourceAutomationId!
						)
					)
			)
				.$notNull()
				.as("triggers"),
			jsonArrayFrom(
				eb
					.selectFrom("action_instances")
					.selectAll("action_instances")
					.whereRef("action_instances.automationId", "=", "automations.id")
					.select((eb) => actionConfigDefaultsSelect(eb).as("defaultedActionConfigKeys"))
			)
				.$notNull()
				.as("actionInstances"),
			jsonObjectFrom(
				eb
					.selectFrom("automation_condition_blocks")
					.whereRef("automation_condition_blocks.automationId", "=", "automations.id")
					.where("automation_condition_blocks.automationConditionBlockId", "is", null)
					.selectAll("automation_condition_blocks")
					.select(sql.lit<"block">("block").as("kind"))
					.select((eb) =>
						// this function is what recursively builds the condition blocks and conditions
						// defined in prisma/migrations/20251105151740_add_condition_block_items_function/migration.sql
						eb
							.fn<
								ConditionBlock[]
							>("get_condition_block_items", ["automation_condition_blocks.id"])
							.as("items")
					)
			).as("condition"),
		])
		.$if(!!options?.event, (eb) => {
			return eb.where((eb) =>
				eb.exists(
					eb
						.selectFrom("automation_triggers")
						.whereRef("automation_triggers.automationId", "=", "automations.id")
						.where("automation_triggers.event", "=", options!.event)
						.$if(!!options?.sourceAutomationId, (qb) =>
							qb.where(
								"automation_triggers.sourceAutomationId",
								"=",
								options!.sourceAutomationId!
							)
						)
				)
			);
		});
});

export const getStageAutomations = cache(
	(stageId: StagesId, options?: GetEventAutomationOptions) => {
		return autoCache(getAutomationBase(options).where("automations.stageId", "=", stageId));
	}
);

export const getAutomation = cache(
	(automationId: AutomationsId, options?: GetEventAutomationOptions) => {
		return autoCache(getAutomationBase(options).where("automations.id", "=", automationId));
	}
);
