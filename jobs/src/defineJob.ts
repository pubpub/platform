import type { JobHelpers } from "graphile-worker";

import { logger as baseLogger } from "logger";

import { Client } from "./clients";

type Job<Payload, Output, C extends Client | undefined = undefined> = (
	payload: Payload,
	logger: typeof baseLogger,
	job: JobHelpers["job"],
	...args: C extends Client ? [client: C] : []
) => Promise<Output>;

export const defineJob = <C extends Client, Payload, Output>(
	...args: [Job<Payload, Output>] | [client: C, job: Job<Payload, Output, Client>]
) => {
	return (payload: Payload, helpers: JobHelpers) => {
		const jobLogger = baseLogger.child({
			job: helpers.job,
		});

		if (args.length === 1) {
			return args[0](payload, jobLogger, helpers.job);
		}

		return args[1](payload, jobLogger, helpers.job, args[0]);
	};
};
