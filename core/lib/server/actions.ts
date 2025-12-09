import type {
	Action,
	ActionInstancesId,
	ActionInstancesUpdate,
	ActionRunStatus,
	AutomationRunsId,
	AutomationsId,
	CommunitiesId,
	NewActionInstances,
	StagesId,
} from "db/public"
import type { IconConfig } from "ui/dynamic-icon"
import type { AutoReturnType } from "../types"

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"

import { db } from "~/kysely/database"
import { autoCache } from "./cache/autoCache"
import { autoRevalidate } from "./cache/autoRevalidate"
import { pubType } from "./pub"

export const getActionInstance = (actionInstanceId: ActionInstancesId) =>
	autoCache(db.selectFrom("action_instances").selectAll().where("id", "=", actionInstanceId))

export const createActionInstance = (props: NewActionInstances) =>
	autoRevalidate(db.insertInto("action_instances").values(props))

export const updateActionInstance = (
	actionInstanceId: ActionInstancesId,
	props: ActionInstancesUpdate
) =>
	autoRevalidate(db.updateTable("action_instances").set(props).where("id", "=", actionInstanceId))

export const removeActionInstance = (actionInstanceId: ActionInstancesId) =>
	autoRevalidate(db.deleteFrom("action_instances").where("id", "=", actionInstanceId))

export const getActionConfigDefaults = (communityId: CommunitiesId, action: Action) => {
	return autoCache(
		db
			.selectFrom("action_config_defaults")
			.selectAll()
			.where("communityId", "=", communityId)
			.where("action", "=", action)
	)
}

export type ActionConfigDefaultFields = Record<Action, string[]>

export const getActionConfigDefaultsFields = async (
	communityId: CommunitiesId
): Promise<ActionConfigDefaultFields> => {
	const result = await autoCache(
		db
			.selectFrom("action_config_defaults")
			.select(["action", "config"])
			.where("communityId", "=", communityId)
	).execute()

	return result.reduce((acc, row) => {
		acc[row.action] = Object.keys(row.config ?? {})
		return acc
	}, {} as ActionConfigDefaultFields)
}

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
	)
}

export type FullAutomationRun = AutoReturnType<typeof getAutomationRuns>["execute"][number]

export const getAutomationRuns = (
	communityId: CommunitiesId,
	options?: {
		limit?: number
		offset?: number
		orderBy?: "createdAt"
		orderDirection?: "desc" | "asc"
		automations?: AutomationsId[]
		statuses?: (ActionRunStatus | "partial")[]
		stages?: StagesId[]
		actions?: Action[]
		query?: string
	}
) => {
	const startQuery = db
		.selectFrom("automation_runs")
		.innerJoin("automations", "automation_runs.automationId", "automations.id")
		.where("automations.communityId", "=", communityId)

	let query = startQuery
	if (options?.automations && options.automations.length > 0) {
		query = query.where("automation_runs.automationId", "in", options.automations)
	}

	if (options?.stages && options.stages.length > 0) {
		query = query.where("automations.stageId", "in", options.stages)
	}

	if (options?.query) {
		query = query.where("automations.name", "ilike", `%${options.query}%`)
	}

	const automationRuns = autoCache(
		query
			.select((eb) => [
				"automation_runs.id",
				"automation_runs.createdAt",
				"automation_runs.updatedAt",
				"automation_runs.triggerEvent",
				"automation_runs.triggerConfig",
				"automation_runs.sourceAutomationRunId",
				"automation_runs.inputJson",
				jsonObjectFrom(
					eb
						.selectFrom("automations")
						.whereRef("automations.id", "=", "automation_runs.automationId")
						.select(["automations.id", "automations.name", "automations.icon"])
						.$narrowType<{ icon: IconConfig | null }>()
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
						.select([
							"action_runs.id",
							"action_runs.actionInstanceId",
							"action_runs.config",
							"action_instances.action",
							"action_runs.status",
							"action_runs.result",
							"action_runs.createdAt",
							"action_runs.updatedAt",
							"action_runs.config",
							"action_runs.event",
							"action_runs.params",
							"action_runs.json",
							"action_runs.pubId",
						])
				).as("actionRuns"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.whereRef("pubs.id", "=", "automation_runs.inputPubId")
						.select([
							"pubs.id",
							"pubs.title",
							"pubs.pubTypeId",
							"pubs.createdAt",
							"pubs.updatedAt",
						])
						.select(pubType({ eb, pubTypeIdRef: "pubs.pubTypeId" }))
				).as("inputPub"),
				jsonObjectFrom(
					eb
						.selectFrom("automation_runs as ar")
						.innerJoin(
							"automation_runs",
							"ar.id",
							"automation_runs.sourceAutomationRunId"
						)
						.whereRef("ar.id", "=", "automation_runs.sourceAutomationRunId")
						.select(["ar.id", "ar.triggerConfig"])
				).as("sourceAutomationRun"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.whereRef("stages.id", "=", "automations.stageId")
						.select(["stages.id", "stages.name"])
				).as("stage"),
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "automation_runs.sourceUserId")
						.select(["users.id", "users.firstName", "users.lastName"])
				).as("sourceUser"),
			])
			.orderBy(
				options?.orderBy ?? "automation_runs.createdAt",
				options?.orderDirection ?? "desc"
			)
			.limit(options?.limit ?? 1000)
			.offset(options?.offset ?? 0)
	)

	return automationRuns
}

export const getAutomationRunsCount = async (
	communityId: CommunitiesId,
	options?: {
		automations?: AutomationsId[]
		stages?: StagesId[]
		query?: string
	}
) => {
	let query = db
		.selectFrom("automation_runs")
		.innerJoin("automations", "automation_runs.automationId", "automations.id")
		.where("automations.communityId", "=", communityId)

	if (options?.automations && options.automations.length > 0) {
		query = query.where("automation_runs.automationId", "in", options.automations)
	}

	if (options?.stages && options.stages.length > 0) {
		query = query.where("automations.stageId", "in", options.stages)
	}

	if (options?.query) {
		query = query.where("automations.name", "ilike", `%${options.query}%`)
	}

	const result = await autoCache(
		query.select((eb) => eb.fn.countAll<number>().as("count"))
	).executeTakeFirst()

	return result?.count ?? 0
}

export const getAutomationRunById = (
	communityId: CommunitiesId,
	automationRunId: AutomationRunsId
) => {
	return autoCache(
		getAutomationRuns(communityId).qb.where("automation_runs.id", "=", automationRunId)
	)
}
