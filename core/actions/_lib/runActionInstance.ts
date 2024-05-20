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
import { getLoginData } from "~/lib/auth/loginData";
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
	args?: Record<string, unknown>;
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
	{ pubId, actionInstanceId, args = {} }: ActionInstanceArgs,
	event?: Event
) => {
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

	if (!event) {
		// If the action was not run by a rule, we record the initiating member.
		const loginData = await getLoginData();
		const member = loginData?.memberships.find(
			(m) => m.communityId === pubResult.value.communityId
		);
	}

	const result = await _runActionInstance(actionInstanceResult.value, pubResult.value, args);

	await db
		.insertInto("action_runs")
		.values({
			action_instance_id: actionInstanceId,
			pub_id: pubId,
			status: "error" in result ? ActionRunStatus.failure : ActionRunStatus.success,
			config: actionInstanceResult.value.config,
			params: args,
			event,
		})
		.execute();

	revalidateTag(`action_runs_${pubResult.value.communityId}`);

	return result;
};

export const runActionInstance = defineServerAction(async function runActionInstance({
	pubId,
	actionInstanceId,
	args = {},
}: ActionInstanceArgs) {
	return runAndRecordActionInstance({ pubId, actionInstanceId, args });
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
