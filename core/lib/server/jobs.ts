import type { Job } from "graphile-worker";

import { makeWorkerUtils } from "graphile-worker";

import type { JobOptions, SendEmailRequestBody } from "contracts";
import { logger } from "logger";

import type { ClientExceptionOptions } from "../serverActions";
import { env } from "../env/env.mjs";

import "date-fns";

import type { Interval } from "~/actions/_lib/rules";
import type { ActionInstancesId } from "~/kysely/types/public/ActionInstances";
import type { PubsId } from "~/kysely/types/public/Pubs";
import type { StagesId } from "~/kysely/types/public/Stages";
import Event from "~/kysely/types/public/Event";
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
	scheduleEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<Job>;
	unscheduleJob(jobKey: string): Promise<void>;
	scheduleAction(options: {
		actionInstanceId: ActionInstancesId;
		stageId: StagesId;
		duration: number;
		interval: Interval;
		pubId: PubsId;
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
			logger.info({ msg: `Unscheduling job with key: ${jobKey}`, job: { key: jobKey } });
			await workerUtils.withPgClient(async (pg) => {
				await pg.query(`SELECT graphile_worker.remove_job($1);`, [jobKey]);
			});

			logger.info({
				msg: `Successfully unscheduled job with key: ${jobKey}`,
				job: { key: jobKey },
			});
		},
		async scheduleAction({ actionInstanceId, stageId, duration, interval, pubId }) {
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
