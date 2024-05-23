// "use server";

import { jsonArrayFrom } from "kysely/helpers/postgres";

import { logger } from "logger";

import type { PubsId } from "~/kysely/types/public/Pubs";
import type { Rules } from "~/kysely/types/public/Rules";
import type { StagesId } from "~/kysely/types/public/Stages";
import { db } from "~/kysely/database";
import Event from "~/kysely/types/public/Event";
import { addDuration } from "~/lib/dates";
import { getJobsClient } from "~/lib/server/jobs";

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
		// .innerJoin("rules", "rules.action_instance_id", "action_instances.id")
		// .where("rules.event", "=", Event.pubInStageForDuration)
		.select((eb) => [
			"action_instances.id as id",
			"action_instances.name as name",
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
		logger.warn({
			msg: `No action instances found for stage ${stageId}`,
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
			.map((rule) => ({ ...rule, actionName: instance.name }))
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
			return {
				result: job,
				actionInstanceId: rule.action_instance_id,
				actionInstanceName: rule.actionName,
				runAt: addDuration({
					duration: rule.config.duration,
					interval: rule.config.interval,
				}).toISOString(),
			};
		})
	);

	return results;
};
