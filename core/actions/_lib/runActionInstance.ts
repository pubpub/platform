import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";

import type { Json } from "contracts";
import type {
	ActionInstancesId,
	ActionRunsId,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { BaseActionInstanceConfig } from "db/types";
import type { Prettify, XOR } from "utils/types";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { ActionSuccess } from "../types";
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { env } from "~/lib/env/env";
import { hydratePubValues } from "~/lib/fields/utils";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, getPubsWithRelatedValues } from "~/lib/server";
import { getActionConfigDefaults } from "~/lib/server/actions";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { MAX_STACK_DEPTH } from "~/lib/server/rules";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { getActionRunByName } from "./getRuns";
import { resolveWithPubfields } from "./resolvePubfields";
import { scheduleActionInstances } from "./scheduleActionInstance";

export type ActionInstanceRunResult = (ClientException | ClientExceptionOptions | ActionSuccess) & {
	stack: ActionRunsId[];
};

export type RunActionInstanceArgs = Prettify<
	{
		communityId: CommunitiesId;
		actionInstanceId: ActionInstancesId;
		actionInstanceArgs?: Record<string, unknown>;
		stack: ActionRunsId[];
		scheduledActionRunId?: ActionRunsId;
		/**
		 * The config for the action instance to use when scheduling the action
		 * Non-optional to make sure it's passed when needed
		 */
		config: Record<string, unknown> | null;
	} & XOR<{ event: Event }, { userId: UsersId }> &
		XOR<{ pubId: PubsId }, { json: Json }>
>;

const getActionInstance = (actionInstanceId: ActionInstancesId, trx = db) =>
	trx
		.selectFrom("action_instances")
		.where("action_instances.id", "=", actionInstanceId)
		.select((eb) => [
			"id",
			eb.fn.coalesce("config", sql<BaseActionInstanceConfig>`'{}'`).as("config"),
			"createdAt",
			"updatedAt",
			"stageId",
			"action",
			"name",
		])
		.executeTakeFirst();

const _runActionInstance = async (
	args: RunActionInstanceArgs & {
		actionInstance: Exclude<Awaited<ReturnType<typeof getActionInstance>>, undefined>;
		actionRunId: ActionRunsId;
	}
): Promise<ActionInstanceRunResult> => {
	const isActionUserInitiated = "userId" in args;

	const stack = [...args.stack, args.actionRunId];
	const pub = args.json
		? null
		: await getPubsWithRelatedValues(
				{
					pubId: args.pubId!,
					communityId: args.communityId,
					userId: isActionUserInitiated ? args.userId : undefined,
				},
				{
					// depth 3 is necessary for the DataCite action to fetch related
					// contributors and their people
					depth: 3,
					withPubType: true,
					withStage: true,
				}
			);

	if (!args.json && !pub) {
		return {
			error: "No input found",
			stack,
		};
	}

	const action = getActionByName(args.actionInstance.action);
	const actionRun = await getActionRunByName(args.actionInstance.action);
	const actionDefaults = await getActionConfigDefaults(
		args.communityId,
		args.actionInstance.action
	).executeTakeFirst();

	if (!actionRun || !action) {
		return {
			error: "Action not found",
			stack,
		};
	}

	const actionConfig = {
		...(actionDefaults?.config as Record<string, any>),
		...(args.actionInstance.config as Record<string, any>),
	};

	const parsedConfig = action.config.schema.safeParse(args.config ?? actionConfig);

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

	let runArgs = parsedArgs.data;
	let config = parsedConfig.data;

	let inputPubInput = pub;

	const argsFieldOverrides = new Set<string>();
	const configFieldOverrides = new Set<string>();
	if (inputPubInput) {
		runArgs = resolveWithPubfields(
			{ ...parsedArgs.data, ...args.actionInstanceArgs },
			inputPubInput.values,
			argsFieldOverrides
		);
		// @ts-expect-error FIXME: will be diff
		config = resolveWithPubfields(
			{ ...args.actionInstance.config, ...parsedConfig.data },
			inputPubInput.values,
			configFieldOverrides
		);

		const hydratedPubValues = hydratePubValues(inputPubInput.values);
		inputPubInput = {
			...inputPubInput,
			values: hydratedPubValues,
		};
	}

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	});

	const jsonOrPubId = args.pubId ? { pubId: args.pubId } : { json: args.json! };
	try {
		// @ts-expect-error TODO: fix this
		const result = await actionRun({
			// FIXME: get rid of any
			config: config as any,
			configFieldOverrides,
			...(inputPubInput ? { pub: inputPubInput } : { json: args.json }),
			// FIXME: get rid of any
			args: runArgs as any,
			argsFieldOverrides,
			stageId: args.actionInstance.stageId,
			communityId: args.communityId,
			lastModifiedBy,
			actionRunId: args.actionRunId,
			userId: isActionUserInitiated ? args.userId : undefined,
			actionInstance: args.actionInstance,
		});

		if (isClientExceptionOptions(result)) {
			await scheduleActionInstances({
				stageId: args.actionInstance.stageId,
				event: Event.actionFailed,
				stack,
				sourceActionInstanceId: args.actionInstance.id,
				...jsonOrPubId,
			});
			return { ...result, stack };
		}

		await scheduleActionInstances({
			stageId: args.actionInstance.stageId,
			event: Event.actionSucceeded,
			stack,
			sourceActionInstanceId: args.actionInstance.id,
			...jsonOrPubId,
		});

		return { ...result, stack };
	} catch (error) {
		captureException(error);
		logger.error(error);

		await scheduleActionInstances({
			stageId: args.actionInstance.stageId,
			event: Event.actionFailed,
			stack,
			sourceActionInstanceId: args.actionInstance.id,
			...jsonOrPubId,
		});

		return {
			title: "Failed to run action",
			error: error.message,
			stack,
		};
	}
};

export async function runActionInstance(args: RunActionInstanceArgs, trx = db) {
	if (args.stack.length > MAX_STACK_DEPTH) {
		throw new Error(
			`Action instance stack depth of ${args.stack.length} exceeds the maximum allowed depth of ${MAX_STACK_DEPTH}`
		);
	}
	const actionInstance = await getActionInstance(args.actionInstanceId);

	if (actionInstance === undefined) {
		return {
			error: "Action instance not found",
			stack: args.stack,
		};
	}

	if (env.FLAGS?.get("disabled-actions").includes(actionInstance.action)) {
		return { ...ApiError.FEATURE_DISABLED, stack: args.stack };
	}

	if (!actionInstance.action) {
		return {
			error: "Action not found",
			stack: args.stack,
		};
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
				json: args.json,
				userId: isActionUserInitiated ? args.userId : null,
				result: { scheduled: `Action to be run immediately` },
				// we are setting it to `scheduled` very briefly
				status: ActionRunStatus.scheduled,
				// this is a bit hacky, would be better to pass this around methinks
				config:
					args.config ??
					eb
						.selectFrom("action_instances")
						.select("config")
						.where("action_instances.id", "=", args.actionInstanceId),
				params: args,
				event: isActionUserInitiated ? undefined : args.event,
				sourceActionRunId: args.stack.at(-1),
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

	const result = await _runActionInstance({ ...args, actionInstance, actionRunId: actionRun.id });

	const status = isClientExceptionOptions(result)
		? ActionRunStatus.failure
		: ActionRunStatus.success;

	logger[status === ActionRunStatus.failure ? "error" : "info"]({
		msg: "Action run finished",
		pubId: args.pubId,
		actionInstanceId: args.actionInstanceId,
		status,
		result,
	});

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
		.innerJoin("rules", "rules.actionInstanceId", "action_instances.id")
		.select([
			"action_instances.id as actionInstanceId",
			"rules.config as ruleConfig",
			"action_instances.name as actionInstanceName",
		])
		.where("rules.event", "=", event)
		.where("action_instances.stageId", "=", stageId)
		.execute();

	const results = await Promise.all(
		instances.map(async (instance) => {
			return {
				actionInstanceId: instance.actionInstanceId,
				actionInstanceName: instance.actionInstanceName,
				result: await runActionInstance(
					{
						pubId,
						communityId,
						actionInstanceId: instance.actionInstanceId,
						event,
						config: instance.ruleConfig ?? null,
						stack,
					},
					trx
				),
			};
		})
	);

	return results;
};
