// "use server";

import { jsonArrayFrom } from "kysely/helpers/postgres";

import type { ActionInstancesId, PubsId, Rules, StagesId } from "db/public";
import { ActionRunStatus, Event } from "db/public";
import { logger } from "logger";

import type { RuleConfig } from "./rules";
import { db } from "~/kysely/database";
import { addDuration } from "~/lib/dates";
import { autoCache } from "~/lib/server/cache/autoCache";
import { autoRevalidate } from "~/lib/server/cache/autoRevalidate";
import { getCommunitySlug } from "~/lib/server/cache/getCommunitySlug";
import { getJobsClient, getScheduledActionJobKey } from "~/lib/server/jobs";

export const scheduleActionInstances = async ({
	pubId,
	stageId,
}: {
	pubId: PubsId;
	stageId: StagesId;
}) => {
	if (!pubId || !stageId) {
		throw new Error("pubId and stageId are required");
	}

	const instances = await autoCache(
		db
			.selectFrom("action_instances")
			.where("action_instances.stageId", "=", stageId)
			.select((eb) => [
				"id",
				"name",
				"config",
				"stageId",
				jsonArrayFrom(
					eb
						.selectFrom("rules")
						.select([
							"rules.id as id",
							"rules.event as event",
							"rules.config as config",
							"actionInstanceId",
						])
						.where("rules.actionInstanceId", "=", eb.ref("action_instances.id"))
						.where("rules.event", "=", Event.pubInStageForDuration)
				).as("rules"),
			])
	).execute();

	if (!instances.length) {
		logger.debug({
			msg: `No action instances found for stage ${stageId}. Most likely this is because a Pub is moved into a stage without action instances.`,
			pubId,
			stageId,
			instances,
		});
		return;
	}

	const validRules = instances.flatMap((instance) =>
		instance.rules
			.filter((rule): rule is Rules & { config: RuleConfig } =>
				Boolean(
					typeof rule.config === "object" &&
						rule.config &&
						"duration" in rule.config &&
						rule.config.duration &&
						"interval" in rule.config &&
						rule.config.interval
				)
			)
			.map((rule) => ({
				...rule,
				actionName: instance.name,
				actionInstanceConfig: instance.config,
			}))
	);

	if (!validRules.length) {
		logger.debug({
			msg: "No action instances connected to a pubInStageForDuration rule found for pub",
			pubId,
			stageId,
			instances,
		});
		return;
	}

	const jobsClient = await getJobsClient();

	const results = await Promise.all(
		validRules.flatMap(async (rule) => {
			const job = await jobsClient.scheduleAction({
				actionInstanceId: rule.actionInstanceId,
				duration: rule.config.duration,
				interval: rule.config.interval,
				stageId: stageId,
				pubId,
				community: {
					slug: await getCommunitySlug(),
				},
			});

			const runAt = addDuration({
				duration: rule.config.duration,
				interval: rule.config.interval,
			}).toISOString();

			if (job.id) {
				await autoRevalidate(
					db.insertInto("action_runs").values({
						actionInstanceId: rule.actionInstanceId,
						pubId: pubId,
						status: ActionRunStatus.scheduled,
						config: rule.actionInstanceConfig,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: Event.pubInStageForDuration,
					})
				).execute();
			}

			return {
				result: job,
				actionInstanceId: rule.actionInstanceId,
				actionInstanceName: rule.actionName,
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
