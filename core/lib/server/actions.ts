import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	Action,
	ActionInstancesId,
	ActionInstancesUpdate,
	AutomationRunsId,
	CommunitiesId,
	NewActionInstances,
} from "db/public";

import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";

export const getActionInstance = (actionInstanceId: ActionInstancesId) =>
	autoCache(db.selectFrom("action_instances").selectAll().where("id", "=", actionInstanceId));

export const createActionInstance = (props: NewActionInstances) =>
	autoRevalidate(db.insertInto("action_instances").values(props));

export const updateActionInstance = (
	actionInstanceId: ActionInstancesId,
	props: ActionInstancesUpdate
) =>
	autoRevalidate(
		db.updateTable("action_instances").set(props).where("id", "=", actionInstanceId)
	);

export const removeActionInstance = (actionInstanceId: ActionInstancesId) =>
	autoRevalidate(db.deleteFrom("action_instances").where("id", "=", actionInstanceId));

export const getActionConfigDefaults = (communityId: CommunitiesId, action: Action) => {
	return autoCache(
		db
			.selectFrom("action_config_defaults")
			.selectAll()
			.where("communityId", "=", communityId)
			.where("action", "=", action)
	);
};

export const setActionConfigDefaults = (
	communityId: CommunitiesId,
	action: Action,
	config: Record<string, unknown>
) => {
	return autoRevalidate(
		db
			.insertInto("action_config_defaults")
			.values({ communityId, action, config })
			.onConflict((oc) =>
				oc
					.constraint("action_config_defaults_communityId_action_key")
					.doUpdateSet({ config })
			)
	);
};

export const getAutomationRuns = (communityId: CommunitiesId) => {
	const actionRuns = autoCache(
		db
			.selectFrom("automation_runs")
			.innerJoin("automations", "automation_runs.automationId", "automations.id")
			.where("automations.communityId", "=", communityId)
			.select((eb) => [
				"automation_runs.id",
				"automation_runs.config",
				"automation_runs.createdAt",
				"automation_runs.updatedAt",
				jsonObjectFrom(
					eb
						.selectFrom("automations")
						.whereRef("automations.id", "=", "automation_runs.automationId")
						.select(["automations.id", "automations.name", "automations.icon"])
				).as("automation"),
				jsonArrayFrom(
					eb
						.selectFrom("action_runs")
						.whereRef("action_runs.automationRunId", "=", "automation_runs.id")
						.leftJoin(
							"action_instances",
							"action_runs.actionInstanceId",
							"action_instances.id"
						)
						.leftJoin("pubs", "action_runs.pubId", "pubs.id")
						.select([
							"action_runs.id",
							"action_runs.actionInstanceId",
							"action_runs.config",
							"action_instances.action",
							"pubs.id as pubId",
							"pubs.title as pubTitle",
							"action_runs.status",
							"action_runs.result",
							"action_runs.createdAt",
							"action_runs.updatedAt",
							"action_runs.config",
							"action_runs.event",
							"action_runs.params",
						])
				).as("actionRuns"),
				"automation_runs.sourceAutomationRunId",
				jsonObjectFrom(
					eb
						.selectFrom("automation_runs as ar")
						.innerJoin(
							"automation_runs",
							"ar.id",
							"automation_runs.sourceAutomationRunId"
						)
						.whereRef("ar.id", "=", "automation_runs.sourceAutomationRunId")
						.select(["ar.id", "ar.config"])
				).as("sourceAutomationRun"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.whereRef("stages.id", "=", "automations.stageId")
						.select(["stages.id", "stages.name"])
				).as("stage"),
				// jsonObjectFrom(
				// 	eb
				// 		.selectFrom("pubs")
				// 		.select(["pubs.id", "pubs.createdAt", "pubs.title"])
				// 		.whereRef("pubs.id", "=", "automation_runs.pubId")
				// 		.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
				// )
				// 	.$notNull()
				// 	.as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "automation_runs.userId")
						.select(["users.id", "users.firstName", "users.lastName"])
				).as("user"),
			])
			.orderBy("automation_runs.createdAt", "desc")
	);

	return actionRuns;
};

export const getAutomationRunById = (
	communityId: CommunitiesId,
	automationRunId: AutomationRunsId
) => {
	return autoCache(
		getAutomationRuns(communityId).qb.where("automation_runs.id", "=", automationRunId)
	);
};
