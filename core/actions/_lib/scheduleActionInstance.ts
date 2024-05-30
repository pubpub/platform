// "use server";

import { jsonArrayFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { Rules } from "~/kysely/types/public/Rules";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import ActionRunStatus from "~/kysely/types/public/ActionRunStatus";
import Event from "~/kysely/types/public/Event";
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
		.where("action_instances.stage_id", "=", stageId)
		.select((eb) => [
			"action_instances.id as id",
			"action_instances.name as name",
			"action_instances.config as config",
			"action_instances.stage_id as stageId",
			jsonArrayFrom(
				eb
					.selectFrom("rules")
					.select([
						"rules.id as id",
						"rules.event as event",
						"rules.config as config",
						"rules.action_instance_id as action_instance_id",
					])
					.where("rules.action_instance_id", "=", eb.ref("action_instances.id"))
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
				actionInstanceId: rule.action_instance_id,
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
						action_instance_id: rule.action_instance_id,
						pub_id: pubId,
						status: ActionRunStatus.scheduled,
						config: rule.actionInstanceConfig,
						result: { scheduled: `Action scheduled for ${runAt}` },
						event: Event.pubInStageForDuration,
					})
					.execute();
			}

			return {
				result: job,
				actionInstanceId: rule.action_instance_id,
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
		logger.debug({ msg: "Unscheduled action", actionInstanceId, stageId, pubId });
	} catch (error) {
		logger.error(error);
		return {
			error: "Failed to unschedule action",
			cause: error,
		};
	}
};
