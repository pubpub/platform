import { JobOptions, SendEmailRequestBody } from "contracts";
import { makeWorkerUtils, Job } from "graphile-worker";

export type JobsClient = {
	scheduleEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<Job>;
};

export const makeJobsClient = async (): Promise<JobsClient> => {
	const workerUtils = await makeWorkerUtils({
		connectionString: process.env.DATABASE_URL,
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
	};
};

let jobsClient: JobsClient;

export const getJobsClient = async () => {
	if (!jobsClient) {
		jobsClient = await makeJobsClient();
	}
	return jobsClient;
};
