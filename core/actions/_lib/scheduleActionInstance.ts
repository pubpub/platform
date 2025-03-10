// "use server";

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

export const scheduleActionInstances = async (
	options: {
		pubId: PubsId;
		stageId: StagesId;
		stack: ActionRunsId[];
	} & GetEventRuleOptions
) => {
	if (!options.pubId || !options.stageId) {
		throw new Error("pubId and stageId are required");
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
						status: ActionRunStatus.scheduled,
						config: rule.actionInstance.config,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: rule.event,
						triggeringActionRunId: options.stack.at(-1),
					})
					.returning("id")
			).executeTakeFirstOrThrow();

			const job = await jobsClient.scheduleAction({
				actionInstanceId: rule.actionInstance.id,
				duration: rule.duration,
				interval: rule.interval,
				stageId: options.stageId,
				pubId: options.pubId,
				community: {
					slug: await getCommunitySlug(),
				},
				stack: options.stack,
				scheduledActionRunId: scheduledActionRun.id,
				event: rule.event,
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

export const unscheduleAction = async ({
	actionInstanceId,
	stageId,
	pubId,
}: {
	actionInstanceId: ActionInstancesId;
	stageId: StagesId;
	pubId: PubsId;
}) => {
	const jobKey = getScheduledActionJobKey({ stageId, actionInstanceId, pubId });
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
