import type { Job } from "graphile-worker";

import { makeWorkerUtils } from "graphile-worker";

import type { JobOptions, SendEmailRequestBody } from "contracts";
import { logger } from "logger";

import type { ClientExceptionOptions } from "../serverActions";
import { env } from "../env/env.mjs";
import { ClientException } from "../serverActions";

import "date-fns";

import type { Interval } from "~/actions/_lib/rules";
import Event from "~/kysely/types/public/Event";
import { addDuration } from "../dates";

export type JobsClient = {
	scheduleEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<Job>;
	unscheduleJob(jobKey: string): Promise<void>;
	scheduleAction(options: {
		actionInstanceId: string;
		stageId: string;
		duration: number;
		interval: Interval;
		pubId: string;
	}): Promise<Job | ClientExceptionOptions>;
};

export const makeJobsClient = async (): Promise<JobsClient> => {
	const workerUtils = await makeWorkerUtils({
		connectionString: env.DATABASE_URL,
	});
	await workerUtils.migrate();
	return {
		async scheduleEmail(
			instanceId: string,
			body: SendEmailRequestBody,
			jobOptions: JobOptions
		) {
			logger.info({
				msg: `Scheduling email with key: ${jobOptions.jobKey}`,
				instanceId,
				job: { key: jobOptions.jobKey },
			});
			const job = await workerUtils.addJob("sendEmail", { instanceId, body }, jobOptions);

			logger.info({
				msg: `Successfully scheduled email with key: ${jobOptions.jobKey}`,
				instanceId,
				job,
			});
			return job;
		},
		async unscheduleJob(jobKey: string) {
			logger.info({ msg: `Unscheduling email with key: ${jobKey}`, job: { key: jobKey } });
			await workerUtils.withPgClient(async (pg) => {
				await pg.query(`SELECT graphile_worker.remove_job($1);`, [jobKey]);
			});
		},
		async scheduleAction({ actionInstanceId, stageId, duration, interval, pubId }) {
			const runAt = addDuration({ duration, interval });

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
					},
					{
						runAt,
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
				};
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
