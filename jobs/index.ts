import { run, JobHelpers, Task } from "graphile-worker";
import { Client, SendEmailRequestBody, makeClient } from "@pubpub/sdk";

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
		const info = await client.sendEmail(instanceId, body);
		helpers.logger.info(`Sent email`, info);
	}) as Task;
	return { sendEmail };
};

const main = async () => {
	try {
		const runner = await run({
			connectionString: process.env.DATABASE_URL,
			concurrency: 5,
			noHandleSignals: false,
			pollInterval: 1000,
			taskList: makeTaskList(client),
		});
		await runner.promise;
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

main();
