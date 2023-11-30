import { JobOptions, SendEmailRequestBody } from "contracts";
import { makeWorkerUtils, Job } from "graphile-worker";
import { serverEnv } from "../env/serverEnv";

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
		connectionString: serverEnv.DATABASE_URL,
	});
	await workerUtils.migrate();
	return {
		async scheduleEmail(
			instanceId: string,
			body: SendEmailRequestBody,
			jobOptions: JobOptions
		) {
			const job = await workerUtils.addJob("sendEmail", { instanceId, body }, jobOptions);
			return job;
		},
		async unscheduleEmail(jobKey: string) {
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
