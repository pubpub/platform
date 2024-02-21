import { run, JobHelpers, Task } from "graphile-worker";
import { Client, SendEmailRequestBody, makeClient } from "@pubpub/sdk";
import { logger } from "logger";

const client = makeClient({});

type InstanceJobPayload<T> = {
	instanceId: string;
	body: T;
};

const makeTaskList = (client: Client<{}>) => {
	const sendEmail = (async (
		payload: InstanceJobPayload<SendEmailRequestBody>,
		helpers: JobHelpers
	) => {
		const { instanceId, body } = payload;
		logger.info({ msg: `Sending email`, body, job: helpers.job });
		const info = await client.sendEmail(instanceId, body);
		logger.info({ msg: `Sent email`, info, job: helpers.job });
	}) as Task;
	return { sendEmail };
};

const main = async () => {
	logger.info("Starting graphile worker");
	try {
		const runner = await run({
			connectionString: process.env.DATABASE_URL,
			concurrency: 5,
			noHandleSignals: false,
			pollInterval: 1000,
			taskList: makeTaskList(client),
		});

		logger.info(runner);
		await runner.promise;
		logger.info(runner);
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

main();
