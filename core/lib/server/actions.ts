import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	Action,
	ActionInstancesId,
	ActionInstancesUpdate,
	CommunitiesId,
	NewActionInstances,
} from "db/public";

import type { ActionRun } from "~/app/c/[communitySlug]/activity/actions/getActionRunsTableColumns";
import { db } from "~/kysely/database";
import { autoCache } from "./cache/autoCache";
import { autoRevalidate } from "./cache/autoRevalidate";
import { pubType } from "./pub";

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

export const getActionRuns = (communityId: CommunitiesId) => {
	const actionRuns = autoCache(
		db
			.selectFrom("stages")
			.where("stages.communityId", "=", communityId)
			.innerJoin("action_instances", "stages.id", "action_instances.stageId")
			.innerJoin("action_runs", "action_instances.id", "action_runs.actionInstanceId")
			.leftJoin("users", "action_runs.userId", "users.id")
			.select((eb) => [
				"action_runs.id",
				"action_runs.config",
				"action_runs.event",
				"action_runs.params",
				"action_runs.status",
				"action_runs.result",
				"action_runs.createdAt",
				"action_runs.json",
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.id", "=", "action_runs.actionInstanceId")
						.select(["action_instances.name", "action_instances.action"])
				).as("actionInstance"),
				"action_runs.sourceActionRunId",
				jsonObjectFrom(
					eb
						.selectFrom("action_runs as ar")
						.innerJoin("action_instances", "ar.actionInstanceId", "action_instances.id")
						.whereRef("ar.id", "=", "action_runs.sourceActionRunId")
						.select(["action_instances.name", "action_instances.action"])
				).as("sourceActionInstance"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.whereRef("stages.id", "=", "action_instances.stageId")
						.select(["stages.id", "stages.name"])
				).as("stage"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.select(["pubs.id", "pubs.createdAt", "pubs.title"])
						.whereRef("pubs.id", "=", "action_runs.pubId")
						.select((eb) => pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
				)
					.$notNull()
					.as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "action_runs.userId")
						.select(["id", "firstName", "lastName"])
				).as("user"),
			])
			.orderBy("action_runs.createdAt", "desc")
			.$castTo<ActionRun>()
	);

	return actionRuns;
};
