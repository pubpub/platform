import { run } from "graphile-worker";

import { logger } from "logger";

import { clients, Clients } from "./clients";
import { emitEvent } from "./jobs/emitEvent";
import { sendEmail } from "./jobs/sendEmail";

const makeTaskList = (clients: Clients): GraphileWorker.Tasks => ({
	sendEmail: sendEmail(clients.integrationClient),
	emitEvent: emitEvent(),
});

const main = async () => {
	logger.info("Starting graphile worker...");
	try {
		const runner = await run({
			connectionString: process.env.DATABASE_URL,
			concurrency: 5,
			noHandleSignals: false,
			pollInterval: 1000,
			taskList: makeTaskList(clients),
		});

		logger.info({ msg: `Successfully started graphile worker`, runner });
		await runner.promise;
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

main();
