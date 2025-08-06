import type {
	Action,
	ActionInstancesId,
	ActionInstancesUpdate,
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
