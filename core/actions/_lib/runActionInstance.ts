import type { ZodError } from "zod";

import { captureException } from "@sentry/nextjs";
import { sql } from "kysely";

import type {
	ActionInstancesId,
	ActionRunsId,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public";
import type { BaseActionInstanceConfig, Json } from "db/types";
import type { Prettify, XOR } from "utils/types";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { run as logRun } from "../log/run";
import type { ActionSuccess } from "../types";
import type { ClientException, ClientExceptionOptions } from "~/lib/serverActions";
import { db } from "~/kysely/database";
import { env } from "~/lib/env/env";
import { hydratePubValues } from "~/lib/fields/utils";
import { createLastModifiedBy } from "~/lib/lastModifiedBy";
import { ApiError, getPubsWithRelatedValues } from "~/lib/server";
import { getActionConfigDefaults } from "~/lib/server/actions";
import { MAX_STACK_DEPTH } from "~/lib/server/automations";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunity } from "~/lib/server/community";
import { isClientExceptionOptions } from "~/lib/serverActions";
import { getActionByName } from "../api";
import { ActionConfigBuilder } from "./ActionConfigBuilder";
import { getActionRunByName } from "./getRuns";
import { createPubProxy } from "./pubProxy";
import { scheduleActionInstances } from "./scheduleActionInstance";

export type ActionInstanceRunResult = (ClientException | ClientExceptionOptions | ActionSuccess) & {
	stack: ActionRunsId[];
};

export type RunActionInstanceArgs = Prettify<
	{
		communityId: CommunitiesId;
		actionInstanceId: ActionInstancesId;
		/**
		 * extra params passed to the action instance
		 * for now these are the manual arguments when running the action
		 * or the config for an automation
		 */
		actionInstanceArgs: Record<string, unknown> | null;
		stack: ActionRunsId[];
		scheduledActionRunId?: ActionRunsId;
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

	const action = getActionByName(args.actionInstance.action);
	const [actionRun, actionDefaults, pub, community] = await Promise.all([
		getActionRunByName(args.actionInstance.action),
		getActionConfigDefaults(args.communityId, args.actionInstance.action).executeTakeFirst(),
		args.json
			? null
			: getPubsWithRelatedValues(
					{
						pubId: args.pubId!,
						communityId: args.communityId,
						userId: isActionUserInitiated ? args.userId : undefined,
					},
					{
						depth: 3,
						withPubType: true,
						withStage: true,
					}
				),
		getCommunity(args.communityId),
	]);

	if (!community) {
		return {
			error: "Community not found",
			stack,
		};
	}

	if (!args.json && !pub) {
		return {
			error: "No input found",
			stack,
		};
	}

	if (!actionRun || !action) {
		return {
			error: "Action not found",
			stack,
		};
	}

	const actionConfigBuilder = new ActionConfigBuilder(args.actionInstance.action)
		.withConfig(args.actionInstance.config as Record<string, any>)
		.withOverrides(args.actionInstanceArgs as Record<string, any>)
		.withDefaults(actionDefaults?.config as Record<string, any>)
		.validate();

	let inputPubInput = pub
		? {
				...pub,
				values: hydratePubValues(pub.values),
			}
		: null;

	let config = null;
	const mergedConfig = actionConfigBuilder.getMergedConfig();
	const actionForInterpolation = {
		...args.actionInstance,
		config: mergedConfig,
	};
	if (inputPubInput) {
		const thing = {
			pub: createPubProxy(inputPubInput, community?.slug),
			action: actionForInterpolation,
		};

		const interpolated = await actionConfigBuilder.interpolate(thing);

		const result = interpolated.validate().getResult();

		if (!result.success) {
			logger.error("Invalid action configuration", {
				// config: result.config,
				error: result.error.message,
				code: result.error.code,
				cause: result.error.zodError,
			});

			return {
				title: "Invalid action configuration",
				error: result.error.message,
				cause: result.error.zodError as ZodError<any>,
				issues: result.error.zodError?.issues,
				stack,
			};
		}

		config = result.config;
	} else {
		const thing = { json: args.json, action: actionForInterpolation };

		const result = (await actionConfigBuilder.interpolate(thing)).getResult();
		if (!result.success) {
			return {
				title: "Invalid action configuration",
				error: result.error.message,
				cause: result.error.zodError ?? result.error.cause,
				issues: result.error.zodError?.issues,
				stack,
			};
		}
		config = result.config;
	}

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	});

	const jsonOrPubId = args.pubId ? { pubId: args.pubId } : { json: args.json! };
	try {
		// just hard cast it to one option so we at least have some typesafety
		const result = await (actionRun as typeof logRun)({
			// FIXME: get rid of any
			config: config as any,
			...(inputPubInput
				? { pub: inputPubInput }
				: { json: args.json ?? ({} as Record<string, any>) }),
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
					args.actionInstanceArgs ??
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
		.innerJoin("automations", "automations.actionInstanceId", "action_instances.id")
		.select([
			"action_instances.id as actionInstanceId",
			"automations.config as automationConfig",
			"action_instances.name as actionInstanceName",
		])
		.where("automations.event", "=", event)
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
						actionInstanceArgs: instance.automationConfig ?? null,
						stack,
					},
					trx
				),
			};
		})
	);

	return results;
};
