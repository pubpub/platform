import { JobHelpers, run, Task } from "graphile-worker";

import { Client, makeClient, SendEmailRequestBody } from "@pubpub/sdk";
import { logger } from "logger";

const client = makeClient({});

type InstanceJobPayload<T> = {
	instanceId: string;
	body: T;
};

// TODO: Use kanel generated types for these
type PubInStagesRow = {
	pubId: string;
	stageId: string;
};

type DBTriggerEventPayload<T> = {
	table: string;
	operation: string;
	new: T;
	old: T;
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

	const emitEvent = ((payload: DBTriggerEventPayload<PubInStagesRow>) => {
		logger.info({ msg: "Emitting event", payload });
	}) as Task;

	return { sendEmail, emitEvent };
};

const main = async () => {
	logger.info("Starting graphile worker...");
	try {
		const runner = await run({
			connectionString: process.env.DATABASE_URL,
			concurrency: 5,
			noHandleSignals: false,
			pollInterval: 1000,
			taskList: makeTaskList(client),
		});

		logger.info({ msg: `Successfully started graphile worker`, runner });
		await runner.promise;
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

main();
