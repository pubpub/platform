import { env } from "~/lib/env/env.mjs";
import { createDatabase } from "./database-init";

export const db = createDatabase({
	url: env.DATABASE_URL,
	logLevel: env.LOG_LEVEL,
	debug: env.KYSELY_DEBUG === "true",
	nodeEnv: env.NODE_ENV,
	latency: env.KYSELY_ARTIFICIAL_LATENCY,
});
