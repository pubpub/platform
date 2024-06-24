// "use server";

import type { ActionInstancesId } from "db/public/ActionInstances";
import type { PubsId } from "db/public/Pubs";
import type { Rules } from "db/public/Rules";
import type { StagesId } from "db/public/Stages";

import ActionRunStatus from "db/public/ActionRunStatus";
import Event from "db/public/Event";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import { db } from "~/kysely/database";
import { addDuration } from "~/lib/dates";
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

	const instances = await db
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
		.execute();

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
			.filter((rule): rule is Rules & { config: { duration: number } } =>
				Boolean(rule.config?.duration && rule.config.interval)
			)
			.map((rule) => ({
				...rule,
				actionName: instance.name,
				actionInstanceConfig: instance.config,
			}))
	);

	if (!validRules.length) {
		logger.warn({ msg: "No action instances found for pub", pubId, stageId, instances });
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
			});

			const runAt = addDuration({
				duration: rule.config.duration,
				interval: rule.config.interval,
			}).toISOString();

			if (job.id) {
				await db
					.insertInto("action_runs")
					.values({
						actionInstanceId: rule.actionInstanceId,
						pubId: pubId,
						status: ActionRunStatus.scheduled,
						config: rule.actionInstanceConfig,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: Event.pubInStageForDuration,
					})
					.execute();
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
		await db
			.deleteFrom("action_runs")
			.where("actionInstanceId", "=", actionInstanceId)
			.where("pubId", "=", pubId)
			.where("action_runs.status", "=", ActionRunStatus.scheduled)
			.execute();

		logger.debug({ msg: "Unscheduled action", actionInstanceId, stageId, pubId });
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to unschedule action",
			cause: error,
		};
	}
};
