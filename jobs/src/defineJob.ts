import type { JobHelpers } from "graphile-worker";

import { logger as baseLogger } from "logger";

import { Client } from "./clients";

type Job<C extends Client, Payload, Output> = (
	payload: Payload,
	logger: typeof baseLogger,
	job: JobHelpers["job"],
	client?: C
) => Promise<Output>;

export const defineJob = <C extends Client, Payload, Output>(job: Job<C, Payload, Output>) => {
	return (client?: C) => (payload: Payload, helpers: JobHelpers) => {
		const jobLogger = baseLogger.child({
			payload,
			job: helpers.job,
		});

		return job(payload, jobLogger, helpers.job, client);
	};
};
