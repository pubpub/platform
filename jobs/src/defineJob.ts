import type { JobHelpers } from "graphile-worker";

import { logger as baseLogger } from "logger";

import type { Client } from "./clients";

type Job<C extends Client, Payload, Output> = (
	client: C,
	payload: Payload,
	logger: typeof baseLogger,
	job: JobHelpers["job"]
) => Promise<Output>;

export const defineJob = <C extends Client, Payload, Output>(job: Job<C, Payload, Output>) => {
	return (client: C) => (payload: Payload, helpers: JobHelpers) => {
		const jobLogger = baseLogger.child({
			job: helpers.job,
		});

		return job(client, payload, jobLogger, helpers.job);
	};
};
