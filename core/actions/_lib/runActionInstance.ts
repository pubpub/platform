"use server";

import { revalidateTag } from "next/cache";
import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";

import { GetPubResponseBody } from "contracts";
import { logger } from "logger";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type Event from "~/kysely/types/public/Event";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import Action from "~/kysely/types/public/Action";
import ActionRunStatus from "~/kysely/types/public/ActionRunStatus";
import { getPub } from "~/lib/server";
import { defineServerAction } from "~/lib/server/defineServerAction";
import { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { ActionSuccess } from "../types";
import { getActionRunByName } from "./getRuns";
import { validatePubValues } from "./validateFields";

type ActionInstanceRunResult = ClientException | ClientExceptionOptions | ActionSuccess;

type ActionInstanceArgs = {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
	runParameters?: Record<string, unknown>;
};

const recordActionRun = async (
	actionInstanceId: ActionInstancesId,
	pubId: PubsId,
	result: ActionInstanceRunResult,
	config?: unknown,
	params?: unknown,
	event?: Event
) => {
	const actionRun = await db
		.insertInto("action_runs")
		.values({
			action_instance_id: actionInstanceId,
			pub_id: pubId,
			status: "error" in result ? ActionRunStatus.failure : ActionRunStatus.success,
			config,
			params,
			event,
		})
		.execute();

	return actionRun;
};

const _runActionInstance = async (
	actionInstance: {
		id: ActionInstancesId;
		action: Action;
		config: unknown;
		createdAt: Date;
		updatedAt: Date;
		stageId: StagesId;
	},
	pub: GetPubResponseBody,
	runParameters = {}
): Promise<ActionInstanceRunResult> => {
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

	const parsedrunParameters = action.runParameters.safeParse(runParameters ?? {});
	if (!parsedrunParameters.success) {
		return {
			title: "Invalid pub config",
			cause: parsedrunParameters.error,
			error: "The action was run with invalid parameters",
		};
	}

	const pubValuesValidationResult = validatePubValues({
		fields: action.pubFields,
		values: pub.values,
	});

	if (pubValuesValidationResult?.error) {
		return {
			error: pubValuesValidationResult.error,
		};
	}

	try {
		const result = await actionRun({
			config: parsedConfig.data as any,
			pub: {
				id: pub.id,
				values: pub.values as any,
			},
			runParameters: runParameters,
			stageId: actionInstance.stageId,
		});

		revalidateTag(`community-stages_${pub.communityId}`);

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

const runAndRecordActionInstance = async (
	{ pubId, actionInstanceId, runParameters = {} }: ActionInstanceArgs,
	event?: Event
) => {
	let result: ActionInstanceRunResult;

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
		result = {
			error: "Pub not found",
			cause: pubResult.reason,
		};
	} else if (actionInstanceResult.status === "rejected") {
		logger.debug({ msg: actionInstanceResult.reason });
		result = {
			error: "Action instance not found",
			cause: actionInstanceResult.reason,
		};
	} else {
		result = await _runActionInstance(
			actionInstanceResult.value,
			pubResult.value,
			runParameters
		);
	}

	await recordActionRun(
		actionInstanceId,
		pubId,
		result,
		actionInstanceResult.status === "fulfilled" ? actionInstanceResult.value.config : undefined,
		runParameters,
		event
	);

	return result;
};

export const runActionInstance = defineServerAction(async function runActionInstance({
	pubId,
	actionInstanceId,
	runParameters = {},
}: ActionInstanceArgs) {
	return runAndRecordActionInstance({ pubId, actionInstanceId, runParameters });
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
				result: await runAndRecordActionInstance(
					{
						pubId,
						actionInstanceId: instance.action_instance_id,
					},
					event
				),
			};
		})
	);

	return results;
};
