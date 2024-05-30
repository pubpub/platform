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

type ScheduledEventPayload = {
	event: Event.pubInStageForDuration;
	duration: number;
	interval: "minute" | "hour" | "day" | "week" | "month" | "year";
	runAt: Date;
	stageId: string;
	pubId: string;
	actionInstanceId: string;
};

enum Event {
	pubEnteredStage = "pubEnteredStage",
	pubLeftStage = "pubLeftStage",
	pubInStageForDuration = "pubInStageForDuration",
}

const apiClient = initClient(api.internal, {
	baseUrl: `${process.env.PUBPUB_URL}/api/v0x/internal`,
	baseHeaders: { authorization: `Bearer ${process.env.API_KEY}` },
	jsonQuery: true,
});

const normalizeEventPayload = <T>(payload: DBTriggerEventPayload<T> | ScheduledEventPayload) => {
	// pubInStageForDuration event, triggered after being scheduled for a while
	if ("event" in payload) {
		return payload;
	}

	// pubInStageForDuration event, triggered after being scheduled for a while
	if (payload.operation === "INSERT") {
		return {
			event: Event.pubEnteredStage,
			...payload.new,
		};
	}

	// pubInStageForDuration event, triggered after being scheduled for a while
	if (payload.operation === "DELETE") {
		return {
			event: Event.pubLeftStage,
			...payload.old,
		};
	}

	// strange null case, should not really happen
	return null;
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

	const emitEvent = (async (
		payload: DBTriggerEventPayload<PubInStagesRow> | ScheduledEventPayload
	) => {
		const eventLogger = logger.child({ payload });
		eventLogger.info({ msg: "Starting emitEvent", payload });

		let schedulePromise: ReturnType<typeof apiClient.scheduleAction> | null = null;

		// try to schedule actions when a pub enters a stage
		if ("operation" in payload && payload.operation === "INSERT") {
			const { stageId, pubId } = payload.new;

			eventLogger.info({ msg: "Attempting to schedule action", stageId, pubId });
			schedulePromise = apiClient.scheduleAction({
				params: { stageId },
				body: { pubId },
			});
		}

		const normalizedEventPayload = normalizeEventPayload(payload);

		if (!normalizedEventPayload) {
			eventLogger.info({ msg: "No event emitted" });
			return;
		}

		const { event, stageId, pubId, ...extra } = normalizedEventPayload;

		eventLogger.info({ msg: `Emitting event ${event}`, extra });

		const resultsPromise = apiClient.triggerAction({
			params: { stageId },
			body: { event, pubId },
		});

		const [scheduleResult, resultsResult] = await Promise.allSettled([
			schedulePromise,
			resultsPromise,
		]);

		if (scheduleResult.status === "rejected") {
			eventLogger.error({
				msg: "Error scheduling action",
				error: scheduleResult.reason,
				scheduleResult,
				stageId,
				pubId,
				event,
				...extra,
			});
		} else if (scheduleResult.value && scheduleResult.value?.status > 400) {
			eventLogger.error({
				msg: `API error scheduling action`,
				error: scheduleResult.value?.body,
				scheduleResult,
				stageId,
				pubId,
				event,
				...extra,
			});
		} else if (
			scheduleResult.value &&
			scheduleResult.value.status === 200 &&
			scheduleResult.value.body?.length > 0
		) {
			eventLogger.info({
				msg: "Action scheduled",
				results: scheduleResult.value,
				stageId,
				pubId,
				event,
				...extra,
			});
		}

		if (resultsResult.status === "rejected") {
			eventLogger.error({
				msg: "Error running action",
				error: resultsResult.reason,
				stageId,
				pubId,
				event,
			});
		} else {
			eventLogger.info({
				msg: "Action run results",
				results: resultsResult.value,
				stageId,
				pubId,
				event,
			});
		}
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
