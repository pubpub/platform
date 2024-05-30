"use server";

import { revalidateTag } from "next/cache";
import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import { GetPubResponseBody } from "contracts";
import { logger } from "logger";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type Event from "~/kysely/types/public/Event";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import Action from "~/kysely/types/public/Action";
import ActionRunStatus from "~/kysely/types/public/ActionRunStatus";
import { UsersId } from "~/kysely/types/public/Users";
import { getPub } from "~/lib/server";
import { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { ActionSuccess } from "../types";
import { getActionRunByName } from "./getRuns";
import { validatePubValues } from "./validateFields";

export type ActionInstanceRunResult = ClientException | ClientExceptionOptions | ActionSuccess;

export type RunActionInstanceArgs = {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
	actionInstanceArgs?: Record<string, unknown>;
} & ({ event: Event } | { userId: UsersId });

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
	args = {}
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

	const parsedArgs = action.params.safeParse(args ?? {});
	if (!parsedArgs.success) {
		return {
			title: "Invalid pub config",
			cause: parsedArgs.error,
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
			args: args,
			stageId: actionInstance.stageId,
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
};

export async function runActionInstance(args: RunActionInstanceArgs) {
	const pubPromise = getPub(args.pubId);

	const actionInstancePromise = db
		.selectFrom("action_instances")
		.where("action_instances.id", "=", args.actionInstanceId)
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

	const pubInStage = await db
		.selectFrom("PubsInStages")
		.where("pubId", "=", args.pubId)
		.where("stageId", "=", actionInstanceResult.value.stageId)
		.selectAll()
		.executeTakeFirst();

	if (!pubInStage) {
		logger.warn({
			msg: `Pub ${args.pubId} is not in stage ${actionInstanceResult.value.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
			pubId: args.pubId,
			actionInstanceId: args.actionInstanceId,
		});
		return {
			error: `Pub ${args.pubId} is not in stage ${actionInstanceResult.value.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
		};
	}

	const result = await _runActionInstance(actionInstanceResult.value, pubResult.value, args);

	await db
		.insertInto("action_runs")
		.values({
			action_instance_id: args.actionInstanceId,
			pub_id: args.pubId,
			user_id: "userId" in args ? args.userId : null,
			status: "error" in result ? ActionRunStatus.failure : ActionRunStatus.success,
			result,
			config: actionInstanceResult.value.config,
			params: args,
			event: "userId" in args ? undefined : args.event,
		})
		.execute();

	return result;
}

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
				result: await runActionInstance({
					pubId,
					actionInstanceId: instance.action_instance_id,
					event,
				}),
			};
		})
	);

	return results;
};
