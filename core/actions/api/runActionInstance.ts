"use server";

import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";

import { logger } from "logger";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import { db } from "~/kysely/database";
import { getPub } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getActionByName } from ".";
import { getActionRunByName } from "../_lib/getRuns";
import { validatePubValues } from "../_lib/validateFields";

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

	const actionInstancePromise = db
		.selectFrom("action_instances")
		.where("action_instances.id", "=", actionInstanceId)
		.select((eb) => [
			"id",
			eb.fn.coalesce("config", sql`'{}'`).as("config"),
			"created_at as createdAt",
			"updated_at as updatedAt",
			"stage_id as stageId",
			"action",
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

	const actionInstance = actionInstanceResult.value;
	const pub = pubResult.value;

	if (!actionInstance.action) {
		return {
			error: "Action not found",
		};
	}

	logger.info(actionInstance.action);
	const action = getActionByName(actionInstance.action);

	const actionRun = await getActionRunByName(actionInstance.action);

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
			config: parsedConfig.data as any,
			pub: {
				id: pubId,
				values: values as any,
			},
			pubConfig: parsedConfig.data,
		});

		return result;
	} catch (error) {
		captureException(error);
		logger.error(error);
		return {
			title: "Failed to run action",
			error: error.message,
		};
	}
});
