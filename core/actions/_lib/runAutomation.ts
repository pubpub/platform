import type { ProcessedPub } from "contracts"
import type { Database } from "db/Database"
import type {
	ActionInstancesId,
	ActionRunsId,
	AutomationEvent,
	AutomationRunsId,
	AutomationsId,
	Communities,
	CommunitiesId,
	PubsId,
	StagesId,
	UsersId,
} from "db/public"
import type { BaseActionInstanceConfig, FullAutomation, Json } from "db/types"
import type { Kysely } from "kysely"
import type { ZodError } from "zod"
import type { run as logRun } from "../log/run"
import type { ActionSuccess } from "../types"

import { captureException } from "@sentry/nextjs"
import { jsonArrayFrom } from "kysely/helpers/postgres"

import { ActionRunStatus } from "db/public"
import { logger } from "logger"
import { expect } from "utils"
import { tryCatch } from "utils/try-catch"

import {
	type ActionRunResult,
	type AutomationRunResult,
	getActionRunStatusFromResult,
	isActionFailure,
	isActionSuccess,
} from "~/actions/results"
import { db } from "~/kysely/database"
import { getAutomation } from "~/lib/db/queries"
import { env } from "~/lib/env/env"
import { createLastModifiedBy } from "~/lib/lastModifiedBy"
import { ApiError, getPubsWithRelatedValues } from "~/lib/server"
import { getActionConfigDefaults, getAutomationRunById } from "~/lib/server/actions"
import { MAX_STACK_DEPTH } from "~/lib/server/automations"
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate"
import { getCommunity } from "~/lib/server/community"
import { type CommunityStage, getStages } from "~/lib/server/stages"
import { isClientExceptionOptions } from "~/lib/serverActions"
import { getActionByName } from "../api"
import { ActionConfigBuilder } from "./ActionConfigBuilder"
import { evaluateConditions } from "./evaluateConditions"
import { getActionRunByName } from "./getRuns"
import { createPubProxy } from "./pubProxy"

export type ActionInstanceRunResult = ActionRunResult

export type RunAutomationArgs = {
	automationId: AutomationsId
	scheduledAutomationRunId?: AutomationRunsId
	trigger: {
		event: AutomationEvent
		config: Record<string, unknown> | null
	}
	// overrides when running manually
	manualActionInstancesOverrideArgs: {
		[actionInstanceId: ActionInstancesId]: Record<string, unknown> | null
	} | null
	// when true, skip condition evaluation (requires overrideAutomationConditions capability)
	skipConditionCheck?: boolean
	userId?: UsersId
	stack: AutomationRunsId[]
	communityId: CommunitiesId
	pubId?: PubsId
	json?: Json
}

export type RunActionInstanceArgs = {
	automation: FullAutomation
	community: Communities
	stage: CommunityStage
	actionInstance: FullAutomation["actionInstances"][number]
	/**
	 * extra params passed to the action instance
	 * these are provided when running the action manually
	 */
	manualActionInstanceOverrideArgs: Record<string, unknown> | null
	// stack: ActionRunsId[];
	actionRunId: ActionRunsId
	pub:
		| ProcessedPub<{
				withPubType: true
				withRelatedPubs: true
				withStage: false
				withValues: true
		  }>
		| undefined
	json: Json | undefined
	stageId: StagesId
	userId?: UsersId
}

/**
 * run a singular action instance on an automation
 */
const runActionInstance = async (args: RunActionInstanceArgs): Promise<ActionInstanceRunResult> => {
	const action = getActionByName(args.actionInstance.action)
	const pub = args.pub

	const [actionRun, actionDefaults] = await Promise.all([
		getActionRunByName(args.actionInstance.action),
		getActionConfigDefaults(args.community.id, args.actionInstance.action).executeTakeFirst(),
	])

	if (!args.json && !pub) {
		logger.error("No input found", {
			actionInstance: args.actionInstance,
			pub,
			json: args.json,
		})
		return {
			success: false,
			error: "No input found",
			config: args.actionInstance.config as BaseActionInstanceConfig,
		}
	}

	if (!actionRun || !action) {
		logger.error("Action not found", {
			actionInstance: args.actionInstance,
			actionRun,
			action,
		})
		return {
			success: false,
			error: "Action not found",
			config: args.actionInstance.config as BaseActionInstanceConfig,
		}
	}

	const actionConfigBuilder = new ActionConfigBuilder(args.actionInstance.action)
		.withConfig(args.actionInstance.config as Record<string, any>)
		.withOverrides(args.manualActionInstanceOverrideArgs ?? {})
		.withDefaults(actionDefaults?.config as Record<string, any>)
		.validate()
	const mergedConfig = actionConfigBuilder.getMergedConfig()
	const actionForInterpolation = {
		...args.actionInstance,
		config: mergedConfig,
	}

	const interpolationData = pub
		? {
				pub: createPubProxy(pub, args.community.slug),
				stage: args.stage,
				action: actionForInterpolation,
			}
		: { json: args.json, action: actionForInterpolation, stage: args.stage }

	const interpolated = await actionConfigBuilder.interpolate(interpolationData)

	const result = interpolated.validate().getResult()

	if (!result.success) {
		logger.error("Invalid action configuration", {
			// config: result.config,
			error: result.error.message,
			code: result.error.code,
			cause: result.error.zodError,
		})

		const failConfig = interpolated.getResult()
		const resultConfig = failConfig.success ? failConfig.config : args.actionInstance.config

		return {
			success: false,
			title: "Invalid action configuration",
			error: result.error.message,
			cause: result.error.zodError as ZodError<any>,
			config: resultConfig,
		}
	}

	const config = result.config

	const lastModifiedBy = createLastModifiedBy({
		actionRunId: args.actionRunId,
	})

	try {
		// just hard cast it to one option so we at least have some typesafety
		const result = await (actionRun as typeof logRun)({
			// FIXME: get rid of any
			config: config as any,
			...(pub ? { pub } : { json: args.json ?? ({} as Record<string, any>) }),
			stageId: args.stageId,
			communityId: args.community.id,
			lastModifiedBy,
			actionRunId: args.actionRunId,
			userId: args.userId,
			automation: args.automation,
		})

		if (isActionSuccess(result)) {
			return { ...result, config }
		}

		if (isActionFailure(result)) {
			return { ...result, config }
		}

		// handle legacy ClientExceptionOptions format
		if (isClientExceptionOptions(result)) {
			return {
				success: false,
				title: result.title,
				error: result.error,
				cause: result.cause,
				config,
			}
		}

		// handle legacy ActionSuccess format
		return {
			success: true,
			report: (result as ActionSuccess).report,
			data: (result as ActionSuccess).data,
			config,
		}
	} catch (error) {
		captureException(error)
		logger.error(error)

		return {
			success: false,
			title: "Failed to run action",
			error: error.message,
			cause: error,
			config: config,
		}
	}
}

export async function runAutomation(
	args: RunAutomationArgs,
	trx = db
): Promise<AutomationRunResult> {
	if (args.stack.length > MAX_STACK_DEPTH) {
		throw new Error(
			`Action instance stack depth of ${args.stack.length} exceeds the maximum allowed depth of ${MAX_STACK_DEPTH}`
		)
	}

	const [pub, automation, community] = await Promise.all([
		args.pubId
			? await getPubsWithRelatedValues(
					{ pubId: args.pubId, communityId: args.communityId },
					{
						withPubType: true,
						withRelatedPubs: true,
						withStage: false,
						withValues: true,
						depth: 3,
					}
				)
			: null,
		getAutomation(args.automationId),
		getCommunity(args.communityId),
	])

	if (!automation) {
		throw new Error(`Automation ${args.automationId} not found`)
	}
	// annoying that this requires an extra await

	const stage = await getStages({
		communityId: args.communityId,
		stageId: expect(automation.stageId, "Can't run automation without a stage"),
		userId: null,
	}).executeTakeFirstOrThrow(() => new Error(`Stage ${automation.stageId} not found`))

	if (
		automation.actionInstances.some((ai) =>
			env.FLAGS?.get("disabled-actions").includes(ai.action)
		)
	) {
		return { ...ApiError.FEATURE_DISABLED, stack: args.stack, actionRuns: [], success: false }
	}

	if (!community) {
		throw new Error(`Community ${args.communityId} not found`)
	}

	// check if we need to evaluate conditions at execution time
	if (automation?.condition && !args.skipConditionCheck) {
		const automationTiming = automation.conditionEvaluationTiming as string | null | undefined
		const shouldEvaluateNow =
			automationTiming === "onExecution" ||
			automationTiming === "both" ||
			// if no timing is set, default to evaluating at execution time for backwards compatibility
			!automationTiming

		if (shouldEvaluateNow) {
			const input = pub
				? { pub: createPubProxy(pub, community?.slug) }
				: { json: args.json ?? ({} as Json) }
			const [error, evaluationResult] = await tryCatch(
				evaluateConditions(automation.condition, input)
			)

			if (error) {
				if (args.scheduledAutomationRunId) {
					const existingAutomationRun = await getAutomationRunById(
						args.communityId,
						args.scheduledAutomationRunId
					).executeTakeFirstOrThrow(
						() => new Error(`Automation run ${args.scheduledAutomationRunId} not found`)
					)

					await insertAutomationRun(trx, {
						automationId: automation.id,
						actionRuns: existingAutomationRun.actionRuns.map((ar) => ({
							config: ar.config as BaseActionInstanceConfig,
							result: { error: error.message },
							status: ActionRunStatus.failure,
							actionInstanceId: expect(
								ar.actionInstanceId,
								`Action instance id is required for action run ${ar.id} when creating automation run`
							),
							id: ar.id,
						})),
						pubId: pub?.id,
						json: args.json,
						communityId: args.communityId,
						stack: args.stack,
						scheduledAutomationRunId: args.scheduledAutomationRunId,
						trigger: args.trigger,
						userId: "userId" in args ? args.userId : undefined,
					})
				}

				return {
					success: false,
					title: "Failed to evaluate conditions",
					error: error.message,
					stack: args.stack,
					actionRuns: [],
				}
			}

			if (!evaluationResult.passed) {
				logger.debug("Automation condition not met at execution time", {
					automationId: automation.id,
					conditionEvaluationTiming: automationTiming,
					condition: automation.condition,
					failureReason: evaluationResult.failureReason,
					failureMessages: evaluationResult.flatMessages,
				})
				return {
					success: false,
					actionRuns: [],
					title: "Automation condition not met",
					error: evaluationResult.flatMessages.map((m) => m.message).join(", "),
					stack: args.stack,
				}
			}

			logger.debug("Automation condition met at execution time", {
				automationId: automation.id,
				conditionEvaluationTiming: automationTiming,
			})
		}
	}

	const isActionUserInitiated = "userId" in args

	const existingAutomationRun = args.scheduledAutomationRunId
		? await getAutomationRunById(
				args.communityId,
				args.scheduledAutomationRunId
			).executeTakeFirstOrThrow(
				() => new Error(`Automation run ${args.scheduledAutomationRunId} not found`)
			)
		: null
	// we need to first create the action run,
	// in case the action modifies the pub and needs to pass the lastModifiedBy field
	// which in this case would be `action-run:<action-run-id>`
	const automationRun = await insertAutomationRun(trx, {
		automationId: args.automationId,
		actionRuns: automation.actionInstances.map((ai) => ({
			id: existingAutomationRun?.actionRuns.find((ar) => ar.actionInstanceId === ai.id)?.id,
			actionInstanceId: ai.id,
			config: ai.config,
			result: { scheduled: `Action to be run immediately` },
			status: ActionRunStatus.scheduled,
		})),
		pubId: pub?.id,
		json: args.json as Json,
		communityId: args.communityId,
		stack: args.stack,
		scheduledAutomationRunId: args.scheduledAutomationRunId,
		trigger: args.trigger,
		userId: isActionUserInitiated ? args.userId : undefined,
	})

	const results: (ActionRunResult & {
		actionInstance: FullAutomation["actionInstances"][number]
		actionRunId: ActionRunsId
	})[] = await Promise.all(
		automation.actionInstances.map(async (ai) => {
			const correcspondingActionRun = automationRun.actionRuns.find(
				(ar) => ar.actionInstanceId === ai.id
			)
			if (!correcspondingActionRun) {
				throw new Error(`Action run not found for action instance ${ai.id}`)
			}
			const result = await runActionInstance({
				...args,
				actionInstance: ai,
				actionRunId: correcspondingActionRun.id,
				stageId: expect(automation.stageId),
				community,
				manualActionInstanceOverrideArgs:
					args.manualActionInstancesOverrideArgs?.[ai.id] ?? null,
				json: args.json,
				stage,
				pub: pub ?? undefined,
				automation,
			})

			logger[result.success === false ? "error" : "info"]({
				msg: "Automation run finished",
				pubId: args.pubId,
				actionInstanceId: ai.id,
				status: result.success ? ActionRunStatus.success : ActionRunStatus.failure,
				result,
			})

			if (result.success === false) {
				return {
					success: false,
					title: "Failed to run action",
					error: result.error,
					cause: result.cause,
					config: result.config,
					actionInstance: ai,
					actionRunId: correcspondingActionRun.id,
				}
			}

			return {
				...result,
				actionInstance: ai,
				actionRunId: correcspondingActionRun.id,
			}
		})
	)

	const finalAutomationRun = await insertAutomationRun(trx, {
		automationId: args.automationId,
		actionRuns: results.map(({ actionRunId, actionInstance, ...result }) => ({
			id: actionRunId,
			actionInstanceId: actionInstance.id,
			config: result.config,
			status: getActionRunStatusFromResult(result),
			result: result,
		})),
		pubId: args.pubId,
		json: args.json,
		trigger: args.trigger,
		communityId: args.communityId,
		stack: args.stack,
		scheduledAutomationRunId: automationRun.id,
		userId: isActionUserInitiated ? args.userId : undefined,
	})

	const success = results.every((r) => r.success === true)

	if (!success) {
		return {
			success: false,
			title: "Automation run failed",
			error: `${results
				.filter((r) => r.success === false)
				.map((r) => r.error)
				.join(", ")}`,
			stack: [...args.stack, finalAutomationRun.id],
			actionRuns: results,
		}
	}

	return {
		success: true,
		title: "Automation run finished",
		stack: [...args.stack, finalAutomationRun.id],
		actionRuns: results,
		data: results.map((r) => r.data).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
	}
}

export async function insertAutomationRun(
	trx: Kysely<Database>,
	args: {
		automationId: AutomationsId
		actionRuns: {
			id?: ActionRunsId
			actionInstanceId: ActionInstancesId
			config: BaseActionInstanceConfig
			result: Record<string, unknown>
			status: ActionRunStatus
		}[]
		pubId?: PubsId
		json?: Json
		trigger: {
			event: AutomationEvent
			config: Record<string, unknown> | null
		}
		communityId: CommunitiesId
		stack: AutomationRunsId[]
		scheduledAutomationRunId?: AutomationRunsId
		userId?: UsersId
	}
) {
	const automatonRun = await autoRevalidate(
		trx
			.with("automationRun", (trx) =>
				trx
					.insertInto("automation_runs")
					.values({
						id: args.scheduledAutomationRunId,
						automationId: args.automationId,
						sourceUserId: args.userId,
						inputJson: args.json,
						inputPubId: args.pubId,
						triggerConfig: args.trigger.config,
						triggerEvent: args.trigger.event,
						sourceAutomationRunId: args.stack.at(-1),
					})
					.returningAll()
					// conflict should only happen if a scheduled action is excecuted
					// not on user initiated actions or on other events
					.onConflict((oc) =>
						oc.column("id").doUpdateSet({
							triggerConfig: args.trigger.config,
							triggerEvent: args.trigger.event,
						})
					)
			)
			.with("actionRuns", (trx) =>
				trx
					.insertInto("action_runs")
					.values((eb) =>
						args.actionRuns.map((ai) => ({
							id: ai.id,
							automationRunId: eb
								.selectFrom("automationRun")
								.select("automationRun.id")
								.where("automationRun.automationId", "=", args.automationId)
								.limit(1),
							actionInstanceId: ai.actionInstanceId,
							pubId: args.pubId,
							json: args.json,
							userId: args.userId,
							config: ai.config,
							event: args.trigger.event,
							status: ai.status,
							result: ai.result,
						}))
					)
					.returningAll()
					// update status and result, and config if it had changed in the meantime
					.onConflict((oc) =>
						oc.column("id").doUpdateSet((eb) => ({
							status: eb.ref("excluded.status"),
							result: eb.ref("excluded.result"),
							config: eb.ref("excluded.config"),
						}))
					)
			)
			.selectFrom("automationRun")
			.selectAll("automationRun")
			.select((eb) =>
				jsonArrayFrom(
					eb
						.selectFrom("actionRuns")
						.selectAll("actionRuns")
						.whereRef("actionRuns.automationRunId", "=", "automationRun.id")
				).as("actionRuns")
			)
	).executeTakeFirstOrThrow()

	return automatonRun
}
