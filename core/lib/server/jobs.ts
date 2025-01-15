import type { Job } from "graphile-worker";

import { makeWorkerUtils } from "graphile-worker";

import { logger } from "logger";

import type { ClientException, ClientExceptionOptions } from "../serverActions";
import { env } from "../env/env.mjs";

import "date-fns";

import type { ActionInstancesId, PubsId, StagesId } from "db/public";
import { Event } from "db/public";

import type { Interval } from "~/actions/_lib/rules";
import { addDuration } from "../dates";

export const getScheduledActionJobKey = ({
	stageId,
	actionInstanceId,
	pubId,
}: {
	stageId: StagesId;
	actionInstanceId: ActionInstancesId;
	pubId: PubsId;
}) => `scheduled-action-${stageId}-${actionInstanceId}-${pubId}`;

export type JobsClient = {
	unscheduleJob(jobKey: string): Promise<void>;
	scheduleAction(options: {
		actionInstanceId: ActionInstancesId;
		stageId: StagesId;
		duration: number;
		interval: Interval;
		pubId: PubsId;
		community: {
			slug: string;
		};
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
		async scheduleAction({ actionInstanceId, stageId, duration, interval, pubId, community }) {
			const runAt = addDuration({ duration, interval });
			const jobKey = getScheduledActionJobKey({ stageId, actionInstanceId, pubId });

			logger.info({
				msg: `Scheduling action with key: ${actionInstanceId} to run at ${runAt}`,
				actionInstanceId,
				stageId,
				duration,
				interval,
				runAt,
				pubId,
			});
			try {
				const job = await workerUtils.addJob(
					"emitEvent",
					{
						event: Event.pubInStageForDuration,
						duration,
						interval,
						runAt,
						actionInstanceId,
						stageId,
						pubId,
						community,
					},
					{
						runAt,
						jobKey,
						jobKeyMode: "replace",
					}
				);

				logger.info({
					msg: `Successfully scheduled action with key: ${actionInstanceId} to run at ${runAt}`,
					actionInstanceId,
					stageId,
					duration,
					interval,
					pubId,
				});
				return job;
			} catch (err) {
				logger.error({
					msg: `Error scheduling action with key: ${actionInstanceId} to run at ${runAt}`,
					actionInstanceId,
					stageId,
					duration,
					interval,
					pubId,
					err,
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
