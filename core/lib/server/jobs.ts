import type { Job } from "graphile-worker";

import { makeWorkerUtils } from "graphile-worker";

import { logger } from "logger";

import type { ClientException, ClientExceptionOptions } from "../serverActions";
import { env } from "../env/env";

import "date-fns";

import type { ActionInstancesId, ActionRunsId, AutomationsId, PubsId, StagesId } from "db/public";
import { Event } from "db/public";

import type { Interval } from "~/actions/_lib/automations";
import { addDuration } from "../dates";

export const getScheduledActionJobKey = ({
	stageId,
	actionInstanceId,
	pubId,
	event,
}: {
	stageId: StagesId;
	actionInstanceId: ActionInstancesId;
	event: Event;
	pubId?: PubsId;
}) => `scheduled-action-${stageId}-${actionInstanceId}${pubId ? `-${pubId}` : ""}-${event}`;

export type JobsClient = {
	unscheduleJob(jobKey: string): Promise<void>;
	scheduleDelayedAutomation(options: {
		automationId: AutomationsId;
		actionInstanceId: ActionInstancesId;
		stageId: StagesId;
		pubId: PubsId;
		duration: number;
		interval: Interval;
		community: {
			slug: string;
		};
		event: Event;
		stack: ActionRunsId[];
		scheduledActionRunId: ActionRunsId;
		config: Record<string, unknown> | null;
	}): Promise<Job | ClientExceptionOptions>;
};

export const makeJobsClient = async (): Promise<JobsClient> => {
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();
	return {
		async unscheduleJob(jobKey: string) {
			logger.info({ msg: `Unscheduling job with key: ${jobKey}`, job: { key: jobKey } });
			await workerUtils.withPgClient(async (pg) => {
				await pg.query(`SELECT graphile_worker.remove_job($1);`, [jobKey]);
			});

			logger.info({
				msg: `Successfully unscheduled job with key: ${jobKey}`,
				job: { key: jobKey },
			});
		},
		async scheduleDelayedAutomation({
			automationId,
			actionInstanceId,
			stageId,
			pubId,
			duration,
			interval,
			community,
			event,
			stack,
			scheduledActionRunId,
			config,
		}) {
			const runAt = addDuration({ duration, interval });
			const jobKey = getScheduledActionJobKey({
				stageId,
				actionInstanceId,
				pubId,
				event,
			});

			logger.info({
				msg: `Scheduling delayed automation ${automationId} to run at ${runAt}`,
				automationId,
				actionInstanceId,
				stageId,
				pubId,
				duration,
				interval,
				config,
				runAt,
				stack,
				event,
				scheduledActionRunId,
			});
			try {
				const job = await workerUtils.addJob(
					"emitEvent",
					{
						type: "RunDelayedAutomation",
						automationId,
						pubId,
						stageId,
						event,
						community,
						stack,
						config,
						actionRunId: scheduledActionRunId,
					},
					{
						runAt,
						jobKey,
						jobKeyMode: "replace",
					}
				);

				logger.info({
					msg: `Successfully scheduled delayed automation ${automationId} to run at ${runAt}`,
					automationId,
					actionInstanceId,
					stageId,
					pubId,
					runAt,
				});
				return job;
			} catch (err) {
				logger.error({
					msg: `Error scheduling delayed automation ${automationId}`,
					automationId,
					actionInstanceId,
					stageId,
					pubId,
					err: err.message,
					stack,
					event,
				});
				return {
					error: err,
				} as ClientException;
			}
		},
	};
};

let jobsClient: JobsClient;

export const getJobsClient = async () => {
	if (!jobsClient) {
		jobsClient = await makeJobsClient();
	}
	return jobsClient;
};
