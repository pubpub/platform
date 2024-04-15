"use server";

import { captureException } from "@sentry/nextjs";
import Ajv from "ajv";
import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import { PubsId } from "~/kysely/types/public/Pubs";
import { getPub } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getActionByName } from ".";
import { getActionRunByName } from "../_lib/getRuns";
import { validatePubValues } from "../_lib/validateFields";

const pubMap = [
	"id",
	"created_at as createdAt",
	"updated_at as updatedAt",
	"pub_type_id as pubTypeId",
	"community_id as communityId",
	"valuesBlob",
	"parent_id as parentId",
	"assignee_id as assigneeId",
] as const;

export const runActionInstance = defineServerAction(async function runActionInstance({
	pubId,
	actionInstanceId,
	pubConfig = {},
}: {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
	pubConfig;
}) {
	const pubPromise = getPub(pubId);
	// const pubPromise = db
	// 	.selectFrom("pubs")
	// 	.select((eb) => [
	// 		"id",
	// 		"created_at as createdAt",
	// 		"updated_at as updatedAt",
	// 		"pub_type_id as pubTypeId",
	// 		"community_id as communityId",
	// 		eb.fn.coalesce("valuesBlob", sql`'{}'`).as("valuesBlob"),
	// 		"parent_id as parentId",
	// 		"assignee_id as assigneeId",
	// 	])
	// 	.where("id", "=", pubId)
	// 	.executeTakeFirstOrThrow();

	const actionInstancePromise = db
		.selectFrom("action_instances")
		.where("action_instances.id", "=", actionInstanceId)
		.select((eb) => [
			"id",
			eb.fn.coalesce("config", sql`'{}'`).as("config"),
			"created_at as createdAt",
			"updated_at as updatedAt",
			"stage_id as stageId",
			"action_id as actionId",
			jsonObjectFrom(
				eb
					.selectFrom("actions")
					.selectAll()
					.select([
						"actions.id",
						"actions.name",
						"actions.created_at as createdAt",
						"actions.updated_at as updatedAt",
						"actions.description",
					])
					.whereRef("actions.id", "=", "action_instances.action_id")
			).as("action"),
		])
		.executeTakeFirstOrThrow();

	const [pubResult, actionInstanceResult] = await Promise.allSettled([
		pubPromise,
		actionInstancePromise,
	]);

	if (pubResult.status === "rejected") {
		return {
			error: "Pub not found",
			cause: pubResult.reason,
		};
	}

	if (actionInstanceResult.status === "rejected") {
		logger.debug({ msg: actionInstanceResult.reason });
		return {
			error: "Action instance not found",
			cause: actionInstanceResult.reason,
		};
	}
	//	console.log(pubResult.value);

	const actionInstance = actionInstanceResult.value;
	const pub = pubResult.value;

	if (!actionInstance.action) {
		return {
			error: "Action not found",
		};
	}

	const action = getActionByName(actionInstance.action.name);

	const actionRun = await getActionRunByName(actionInstance.action.name);

	if (!actionRun || !action) {
		return {
			error: "Action not found",
		};
	}

	const parsedConfig = action.config.safeParse(actionInstance.config ?? {});
	if (!parsedConfig.success) {
		return {
			error: "Invalid config",
			cause: parsedConfig.error,
		};
	}

	const parsedPubConfig = action.pubConfig.safeParse(pubConfig ?? {});
	if (!parsedPubConfig.success) {
		return {
			title: "Invalid pub config",
			error: parsedPubConfig.error,
		};
	}

	const values = validatePubValues({
		fields: action.pubFields,
		values: pub.values,
	});

	if (values.error) {
		return {
			error: values.error,
		};
	}

	try {
		const result = await actionRun({
			config: parsedConfig.data,
			pub: {
				id: pubId,
				values: pub.valuesBlob,
			},
			pubConfig: parsedConfig.data,
		});

		return result;
	} catch (error) {
		captureException(error);
		console.log(error);
		return {
			title: "Failed to run action",
			error: error.message,
		};
	}
});
