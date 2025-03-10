import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import type {
	ActionInstancesId,
	ActionRunsId,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { ActionSuccess } from "../types";
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { hydratePubValues } from "~/lib/fields/utils";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { getPubsWithRelatedValuesAndChildren } from "~/lib/server";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { isClientException, isClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { isScheduableRuleEvent } from "../types";
import { getActionRunByName } from "./getRuns";
import { resolveWithPubfields } from "./resolvePubfields";
import { scheduleActionInstances } from "./scheduleActionInstance";

export type ActionInstanceRunResult = (ClientException | ClientExceptionOptions | ActionSuccess) & {
	stack: ActionRunsId[];
};

export type RunActionInstanceArgs = {
	pubId: PubsId;
	communityId: CommunitiesId;
	actionInstanceId: ActionInstancesId;
	actionInstanceArgs?: Record<string, unknown>;
	stack: ActionRunsId[];
	scheduledActionRunId?: ActionRunsId;
} & ({ event: Event } | { userId: UsersId });

const _runActionInstance = async (
	args: RunActionInstanceArgs & { actionRunId: ActionRunsId },
	trx = db
): Promise<ActionInstanceRunResult> => {
	const isActionUserInitiated = "userId" in args;

	const stack = [...args.stack, args.actionRunId];

	const pubPromise = getPubsWithRelatedValuesAndChildren(
		{
			pubId: args.pubId,
			communityId: args.communityId,
			userId: isActionUserInitiated ? args.userId : undefined,
		},
		{
			withPubType: true,
			withStage: true,
		}
	);

	const actionInstancePromise = trx
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
			stack,
		};
	}

	if (actionInstanceResult.status === "rejected") {
		logger.error({ msg: actionInstanceResult.reason });
		return {
			error: "Action instance not found",
			cause: actionInstanceResult.reason,
			stack,
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
			stack,
		};
	}

	if (!actionInstance.action) {
		return {
			error: "Action not found",
			stack,
		};
	}

	const action = getActionByName(actionInstance.action);
	const actionRun = await getActionRunByName(actionInstance.action);

	if (!actionRun || !action) {
		return {
			error: "Action not found",
			stack,
		};
	}

	const parsedConfig = action.config.schema.safeParse(actionInstance.config ?? {});

	if (!parsedConfig.success) {
		const err = {
			error: "Invalid config",
			cause: parsedConfig.error,
			stack,
		};
		if (args.actionInstanceArgs) {
			// Check if the args passed can substitute for missing or invalid config
			const argsParsedAsConfig = action.config.schema.safeParse(args.actionInstanceArgs);
			if (!argsParsedAsConfig.success) {
				return err;
			}
		} else {
			return err;
		}
	}

	const parsedArgs = action.params.schema.safeParse(args.actionInstanceArgs ?? {});

	if (!parsedArgs.success) {
		return {
			title: "Invalid pub config",
			cause: parsedArgs.error,
			error: "The action was run with invalid parameters",
			stack,
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

	const argsFieldOverrides = new Set<string>();
	const configFieldOverrides = new Set<string>();

	const argsWithPubfields = resolveWithPubfields(
		{ ...parsedArgs.data, ...args.actionInstanceArgs },
		pub.values,
		argsFieldOverrides
	);
	const configWithPubfields = resolveWithPubfields(
		{ ...(actionInstance.config as {}), ...parsedConfig.data },
		pub.values,
		configFieldOverrides
	);

	const hydratedPubValues = hydratePubValues(pub.values);

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	});

	try {
		const result = await actionRun({
			// FIXME: get rid of any
			config: configWithPubfields as any,
			configFieldOverrides,
			pub: {
				...pub,
				values: hydratedPubValues,
			},
			// FIXME: get rid of any
			args: argsWithPubfields as any,
			argsFieldOverrides,
			stageId: actionInstance.stageId,
			communityId: pub.communityId as CommunitiesId,
			lastModifiedBy,
			actionRunId: args.actionRunId,
		});

		if (isClientExceptionOptions(result)) {
			await scheduleActionInstances({
				pubId: args.pubId,
				stageId: actionInstance.stageId,
				event: Event.actionFailed,
				stack,
				watchedActionInstanceId: actionInstance.id,
			});
			return { ...result, stack };
		}

		await scheduleActionInstances({
			pubId: args.pubId,
			stageId: actionInstance.stageId,
			event: Event.actionSucceeded,
			stack,
			watchedActionInstanceId: actionInstance.id,
		});

		return { ...result, stack };
	} catch (error) {
		captureException(error);
		logger.error(error);

		await scheduleActionInstances({
			pubId: args.pubId,
			stageId: actionInstance.stageId,
			event: Event.actionFailed,
			stack,
			watchedActionInstanceId: actionInstance.id,
		});

		return {
			title: "Failed to run action",
			error: error.message,
			stack,
		};
	}
};

const MAX_STACK_DEPTH = 10 as const;

export async function runActionInstance(args: RunActionInstanceArgs, trx = db) {
	if (args.stack.length > MAX_STACK_DEPTH) {
		throw new Error(
			`Action instance stack depth of ${args.stack.length} exceeds the maximum allowed depth of ${MAX_STACK_DEPTH}`
		);
	}

	const isActionUserInitiated = "userId" in args;

	// we need to first create the action run,
	// in case the action modifies the pub and needs to pass the lastModifiedBy field
	// which in this case would be `action-run:<action-run-id>`

	const actionRuns = await autoRevalidate(
		trx
			.insertInto("action_runs")
			.values((eb) => ({
				id: args.scheduledActionRunId,
				actionInstanceId: args.actionInstanceId,
				pubId: args.pubId,
				userId: isActionUserInitiated ? args.userId : null,
				result: { scheduled: `Action to be run immediately` },
				// we are setting it to `scheduled` very briefly
				status: ActionRunStatus.scheduled,
				// this is a bit hacky, would be better to pass this around methinks
				config: eb
					.selectFrom("action_instances")
					.select("config")
					.where("action_instances.id", "=", args.actionInstanceId),
				params: args,
				event: isActionUserInitiated ? undefined : args.event,
				triggeringActionRunId: args.stack.at(-1),
			}))
			.returningAll()
			// conflict should only happen if a scheduled action is excecuted
			// not on user initiated actions or on other events
			.onConflict((oc) =>
				oc.column("id").doUpdateSet({
					params: args,
					event: "userId" in args ? undefined : args.event,
				})
			)
	).execute();

	if (actionRuns.length > 1) {
		const errorMessage: ActionInstanceRunResult = {
			title: "Action run failed",
			error: `Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`,
			cause: `Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`,
			stack: args.stack,
		};

		await autoRevalidate(
			trx
				.updateTable("action_runs")
				.set({
					status: ActionRunStatus.failure,
					result: errorMessage,
				})
				.where(
					"id",
					"in",
					actionRuns.map((ar) => ar.id)
				)
		).execute();

		throw new Error(
			`Multiple scheduled action runs found for pub ${args.pubId} and action instance ${args.actionInstanceId}. This should never happen.`
		);
	}

	const actionRun = actionRuns[0];

	const result = await _runActionInstance({ ...args, actionRunId: actionRun.id });

	const status = isClientExceptionOptions(result)
		? ActionRunStatus.failure
		: ActionRunStatus.success;

	// update the action run with the result
	await autoRevalidate(
		trx
			.updateTable("action_runs")
			.set({ status, result })
			.where("id", "=", args.scheduledActionRunId ?? actionRun.id)
	).executeTakeFirstOrThrow(
		() =>
			new Error(
				`Failed to update action run ${actionRun.id} for pub ${args.pubId} and action instance ${args.actionInstanceId}`
			)
	);

	return result;
}

export const runInstancesForEvent = async (
	pubId: PubsId,
	stageId: StagesId,
	event: Event,
	communityId: CommunitiesId,
	stack: ActionRunsId[],
	trx = db
) => {
	const instances = await trx
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
				result: await runActionInstance(
					{
						pubId,
						communityId,
						actionInstanceId: instance.actionInstanceId,
						event,
						stack,
					},
					trx
				),
			};
		})
	);

	return results;
};
