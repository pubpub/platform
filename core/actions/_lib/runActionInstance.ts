"use server";

import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type { ActionInstancesId, CommunitiesId, PubsId, StagesId, UsersId } from "db/public";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { ActionSuccess } from "../types";
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { getPub, getPubCached } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getActionByName } from "../api";
import { getActionRunByName } from "./getRuns";
import { resolveWithPubfields } from "./resolvePubfields";
import { validatePubValues } from "./validateFields";

export type ActionInstanceRunResult = ClientException | ClientExceptionOptions | ActionSuccess;

export type RunActionInstanceArgs = {
	pubId: PubsId;
	actionInstanceId: ActionInstancesId;
	actionInstanceArgs?: Record<string, unknown>;
} & ({ event: Event } | { userId: UsersId });

const _runActionInstance = async (
	args: RunActionInstanceArgs
): Promise<ActionInstanceRunResult> => {
	const pubPromise = getPubCached(args.pubId);

	const actionInstancePromise = db
		.selectFrom("action_instances")
		.where("action_instances.id", "=", args.actionInstanceId)
		.select((eb) => [
			"id",
			eb.fn.coalesce("config", sql`'{}'`).as("config"),
			"createdAt",
			"updatedAt",
			"stageId",
			"action",
			// this is to check whether the pub is still in the stage the actionInstance is in
			// often happens when an action is scheduled but a pub is moved before the action runs
			jsonObjectFrom(
				eb
					.selectFrom("PubsInStages")
					.select(["pubId", "stageId"])
					.where("pubId", "=", args.pubId)
					.whereRef("stageId", "=", "action_instances.stageId")
			).as("pubInStage"),
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

	if (!actionInstance.pubInStage) {
		logger.warn({
			msg: `Pub ${args.pubId} is not in stage ${actionInstance.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
			pubId: args.pubId,
			actionInstanceId: args.actionInstanceId,
		});
		return {
			error: `Pub ${args.pubId} is not in stage ${actionInstance.stageId}, even though the action instance is.
			This most likely happened because the pub was moved before the time the action was scheduled to run.`,
		};
	}

	if (!actionInstance.action) {
		return {
			error: "Action not found",
		};
	}

	const action = getActionByName(actionInstance.action);
	const actionRun = await getActionRunByName(actionInstance.action);

	if (!actionRun || !action) {
		return {
			error: "Action not found",
		};
	}

	const parsedConfig = action.config.schema.safeParse(actionInstance.config ?? {});

	if (!parsedConfig.success) {
		return {
			error: "Invalid config",
			cause: parsedConfig.error,
		};
	}

	const parsedArgs = action.params.schema.safeParse(args.actionInstanceArgs ?? {});

	if (!parsedArgs.success) {
		return {
			title: "Invalid pub config",
			cause: parsedArgs.error,
			error: "The action was run with invalid parameters",
		};
	}

	// TODO: restore validation https://github.com/pubpub/v7/issues/455
	// const pubValuesValidationResult = validatePubValues({
	// 	fields: action.pubFields,
	// 	values: pub.values,
	// });

	// if (pubValuesValidationResult?.error) {
	// 	return {
	// 		error: pubValuesValidationResult.error,
	// 	};
	// }

	const argsWithPubfields = resolveWithPubfields(
		{ ...parsedArgs.data, ...args.actionInstanceArgs },
		pub.values
	);
	const configWithPubfields = resolveWithPubfields(
		{ ...(actionInstance.config as {}), ...parsedConfig.data },
		pub.values
	);

	try {
		const result = await actionRun({
			// FIXME: get rid of any
			config: configWithPubfields as any,
			pub: {
				id: pub.id,
				// FIXME: get rid of any
				values: pub.values as any,
				assignee: pub.assignee ?? undefined,
				parentId: pub.parentId,
			},
			// FIXME: get rid of any
			args: argsWithPubfields as any,
			stageId: actionInstance.stageId,
			communityId: pub.communityId as CommunitiesId,
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
	const result = await _runActionInstance(args);

	const isActionUserInitiated = "userId" in args;

	await autoRevalidate(
		db
			.with(
				"existingScheduledActionRun",
				(db) =>
					db
						.selectFrom("action_runs")
						.selectAll()
						.where("actionInstanceId", "=", args.actionInstanceId)
						.where("pubId", "=", args.pubId)
						.where("status", "=", ActionRunStatus.scheduled)
				// this should be guaranteed to be unique, as only one actionInstance should be scheduled per pub
			)
			.insertInto("action_runs")
			.values((eb) => ({
				id:
					isActionUserInitiated || args.event !== Event.pubInStageForDuration
						? undefined
						: eb.selectFrom("existingScheduledActionRun").select("id"),
				actionInstanceId: args.actionInstanceId,
				pubId: args.pubId,
				userId: isActionUserInitiated ? args.userId : null,
				status: "error" in result ? ActionRunStatus.failure : ActionRunStatus.success,
				result,
				// this is a bit hacky, would be better to pass this around methinks
				config: eb
					.selectFrom("action_instances")
					.select("config")
					.where("action_instances.id", "=", args.actionInstanceId),
				params: args,
				event: isActionUserInitiated ? undefined : args.event,
			}))
			// conflict should only happen if a scheduled action is excecuted
			// not on user initiated actions or on other events
			.onConflict((oc) =>
				oc.column("id").doUpdateSet({
					result,
					params: args,
					event: "userId" in args ? undefined : args.event,
					status: "error" in result ? ActionRunStatus.failure : ActionRunStatus.success,
				})
			)
	).execute();

	return result;
}

export const runInstancesForEvent = async (pubId: PubsId, stageId: StagesId, event: Event) => {
	const instances = await db
		.selectFrom("action_instances")
		.where("action_instances.stageId", "=", stageId)
		.innerJoin("rules", "rules.actionInstanceId", "action_instances.id")
		.where("rules.event", "=", event)
		.selectAll()
		.execute();

	const results = await Promise.all(
		instances.map(async (instance) => {
			return {
				actionInstanceId: instance.actionInstanceId,
				actionInstanceName: instance.name,
				result: await runActionInstance({
					pubId,
					actionInstanceId: instance.actionInstanceId,
					event,
				}),
			};
		})
	);

	return results;
};
