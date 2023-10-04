import { JobOptions, SendEmailRequestBody } from "contracts";
import { makeWorkerUtils, Job } from "graphile-worker";

export type JobsClient = {
	sendEmail(
		instanceId: string,
		email: SendEmailRequestBody,
		jobOptions: JobOptions
	): Promise<Job>;
};

export const makeJobsClient = async () => {
	const workerUtils = await makeWorkerUtils({
		connectionString: process.env.DATABASE_URL,
	});
	await workerUtils.migrate();
	return {
		async sendEmail(instanceId: string, email: SendEmailRequestBody, jobOptions: JobOptions) {
			const job = await workerUtils.addJob("sendEmail", [instanceId, email], jobOptions);
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
