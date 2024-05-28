"use server";

import { revalidateTag } from "next/cache";
import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";

import { logger } from "logger";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type Event from "~/kysely/types/public/Event";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import { getPub } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { getActionByName } from "../api";
import { getActionRunByName } from "./getRuns";
import { validatePubValues } from "./validateFields";

type ActionInstanceArgs = {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
	runParameters?: Record<string, unknown>;
};

const _runActionInstance = async ({
	pubId,
	actionInstanceId,
	runParameters = {},
}: ActionInstanceArgs) => {
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
		logger.error({ msg: actionInstanceResult.reason });
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

	const pubInStage = await db
		.selectFrom("PubsInStages")
		.where("pubId", "=", pubId)
		.where("stageId", "=", actionInstance.stageId)
		.selectAll()
		.executeTakeFirst();

	if (!pubInStage) {
		logger.warn({
			msg: `Pub ${pubId} is not in stage ${actionInstance.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
			pubId,
			actionInstanceId,
		});
		return {
			error: `Pub ${pubId} is not in stage ${actionInstance.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
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

	const parsedrunParameters = action.runParameters.safeParse(runParameters ?? {});
	if (!parsedrunParameters.success) {
		return {
			title: "Invalid pub config",
			error: parsedrunParameters.error,
		};
	}

	const values = validatePubValues({
		fields: action.pubFields,
		values: pub.values,
	});

	if (values.error) {
		logger.error(values.error);
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
			runParameters: runParameters,
			stageId: actionInstance.stageId,
		});

		// revalidateTag(`community-stages_${pub.communityId}`);

		return result;
	} catch (error) {
		captureException(error);
		logger.error(error);
		return {
			title: "Failed to run action",
			error: error.message,
		};
	}
};

export const runActionInstance = defineServerAction(async function runActionInstance({
	pubId,
	actionInstanceId,
	runParameters = {},
}: ActionInstanceArgs) {
	return _runActionInstance({ pubId, actionInstanceId, runParameters });
});

export const runInstancesForEvent = async (pubId: PubsId, stageId: StagesId, event: Event) => {
	const instances = await db
		.selectFrom("action_instances")
		.where("action_instances.stage_id", "=", stageId)
		.innerJoin("rules", "rules.action_instance_id", "action_instances.id")
		.where("rules.event", "=", event)
		.selectAll()
		.execute();

	const results = await Promise.all(
		instances.map(async (instance) => {
			return {
				actionInstanceId: instance.action_instance_id,
				actionInstanceName: instance.name,
				result: await _runActionInstance({
					pubId,
					actionInstanceId: instance.action_instance_id,
				}),
			};
		})
	);

	return results;
};
