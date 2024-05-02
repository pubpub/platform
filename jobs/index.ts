import { initClient } from "@ts-rest/core";
import { JobHelpers, run, Task } from "graphile-worker";

import { Client, makeClient, SendEmailRequestBody } from "@pubpub/sdk";
import { api } from "contracts";
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

	const emitEvent = (async (payload: DBTriggerEventPayload<PubInStagesRow>) => {
		const eventLogger = logger.child({ payload });
		eventLogger.debug({ msg: "Starting emitEvent", payload });
		const client = initClient(api.internal, {
			baseUrl: `${process.env.PUBPUB_URL}/api/v0`,
			baseHeaders: { authorization: `Bearer ${process.env.API_KEY}` },
			jsonQuery: true,
		});
		let event: "pubLeftStage" | "pubEnteredStage" | "" = "";
		let stageId: string = "";
		let pubId: string = "";
		if (payload.operation === "INSERT") {
			event = "pubEnteredStage";
			stageId = payload.new.stageId;
			pubId = payload.new.pubId;
		} else if (payload.operation === "DELETE") {
			event = "pubLeftStage";
			stageId = payload.old.stageId;
			pubId = payload.old.pubId;
		}

		if (!event || !pubId || !stageId) {
			eventLogger.debug({ msg: "No event emitted" });
			return;
		}

		eventLogger.debug({ msg: "Emitting event", event });
		const results = await client.triggerAction({ params: { stageId }, body: { event, pubId } });

		eventLogger.debug({ msg: "Action run results", results, event });
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
