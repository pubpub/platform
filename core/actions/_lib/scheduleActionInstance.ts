import type { ActionInstancesId, ActionRunsId, PubsId, StagesId } from "db/public";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { SchedulableRule } from "./rules";
import type { GetEventRuleOptions } from "~/lib/db/queries";
import { db } from "~/kysely/database";
import { addDuration } from "~/lib/dates";
import { getStageRules } from "~/lib/db/queries";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getJobsClient, getScheduledActionJobKey } from "~/lib/server/jobs";

type Shared = {
	stageId: StagesId;
	stack: ActionRunsId[];
	/* Config for the action instance */
	config?: Record<string, unknown>;
} & GetEventRuleOptions;

type ScheduleActionInstanceForPubOptions = Shared & {
	pubId: PubsId;
	json?: never;
};

type ScheduleActionInstanceGenericOptions = Shared & {
	pubId?: never;
	json: Record<string, unknown>;
};

type ScheduleActionInstanceOptions =
	| ScheduleActionInstanceForPubOptions
	| ScheduleActionInstanceGenericOptions;

export const scheduleActionInstances = async (options: ScheduleActionInstanceOptions) => {
	if (!options.stageId) {
		throw new Error("StageId is required");
	}

	if (!options.pubId && !options.json) {
		throw new Error("PubId or body is required");
	}

	const [rules, jobsClient] = await Promise.all([
		getStageRules(options.stageId, options).execute(),
		getJobsClient(),
	]);

	if (!rules.length) {
		logger.debug({
			msg: `No action instances found for stage ${options.stageId}. Most likely this is because a Pub is moved into a stage without action instances.`,
			pubId: options.pubId,
			stageId: options.stageId,
			rules,
		});
		return;
	}

	const validRules = rules
		.filter(
			(rule): rule is typeof rule & SchedulableRule =>
				rule.event === Event.actionFailed ||
				rule.event === Event.actionSucceeded ||
				rule.event === Event.webhook ||
				(rule.event === Event.pubInStageForDuration &&
					Boolean(
						typeof rule.config === "object" &&
							rule.config &&
							"duration" in rule.config &&
							rule.config.duration &&
							"interval" in rule.config &&
							rule.config.interval
					))
		)
		.map((rule) => ({
			...rule,
			duration: rule.config?.duration || 0,
			interval: rule.config?.interval || "minute",
		}));

	const results = await Promise.all(
		validRules.flatMap(async (rule) => {
			const runAt = addDuration({
				duration: rule.duration,
				interval: rule.interval,
			}).toISOString();

			const scheduledActionRun = await autoRevalidate(
				db
					.insertInto("action_runs")
					.values({
						actionInstanceId: rule.actionInstance.id,
						pubId: options.pubId,
						json: options.json,
						status: ActionRunStatus.scheduled,
						config: rule.actionInstance.config,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: rule.event,
						sourceActionRunId: options.stack.at(-1),
					})
					.returning("id")
			).executeTakeFirstOrThrow();

			const job = await jobsClient.scheduleAction({
				actionInstanceId: rule.actionInstance.id,
				duration: rule.duration,
				interval: rule.interval,
				stageId: options.stageId,
				community: {
					slug: await getCommunitySlug(),
				},
				stack: options.stack,
				scheduledActionRunId: scheduledActionRun.id,
				event: rule.event,
				...(options.pubId ? { pubId: options.pubId } : { body: options.json! }),
			});

			return {
				result: job,
				actionInstanceId: rule.actionInstance.id,
				actionInstanceName: rule.actionInstance.name,
				runAt,
			};
		})
	);

	return results;
};

// FIXME: this should be updated to allow unscheduling jobs which aren't pub based
export const unscheduleAction = async ({
	actionInstanceId,
	stageId,
	pubId,
	event,
}: {
	actionInstanceId: ActionInstancesId;
	stageId: StagesId;
	pubId: PubsId;
	event: Omit<Event, "webhook" | "actionSucceeded" | "actionFailed">;
}) => {
	const jobKey = getScheduledActionJobKey({
		stageId,
		actionInstanceId,
		pubId,
		event: event as Event,
	});
	try {
		const jobsClient = await getJobsClient();
		await jobsClient.unscheduleJob(jobKey);

		// TODO: this should probably be set to "canceled" instead of deleting the run
		await autoRevalidate(
			db
				.deleteFrom("action_runs")
				.where("actionInstanceId", "=", actionInstanceId)
				.where("pubId", "=", pubId)
				.where("action_runs.status", "=", ActionRunStatus.scheduled)
		).execute();

		logger.debug({ msg: "Unscheduled action", actionInstanceId, stageId, pubId });
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to unschedule action",
			cause: error,
		};
	}
};
