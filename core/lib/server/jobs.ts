import { JobOptions, SendEmailRequestBody } from "contracts";
import { makeWorkerUtils, Job } from "graphile-worker";
import { logger } from "logger";
import { env } from "../env/env.mjs";

export type JobsClient = {
	scheduleEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<Job>;
	unscheduleEmail(jobKey: string): Promise<void>;
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
		async unscheduleEmail(jobKey: string) {
			logger.info({ msg: `Unscheduling email with key: ${jobKey}`, job: { key: jobKey } });
			await workerUtils.withPgClient(async (pg) => {
				await pg.query(`SELECT graphile_worker.remove_job($1);`, [jobKey]);
			});
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
