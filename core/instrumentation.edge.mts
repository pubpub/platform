import * as Sentry from "@sentry/nextjs";

import { logger } from "logger";

import { env } from "./lib/env/env.mjs";

logger.info("Running instrumentation hook for nodejs...");

if (env.NODE_ENV === "production") {
	logger.info("Instrumenting Sentry...");
	Sentry.init({
		dsn: "https://5012643b47ea6b2c8917f14442066f23@o31718.ingest.sentry.io/4505959187480576",

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,
	});
	logger.info("✅ Successfully instrumented Sentry");
}

logger.info("instrumentation hooked in for edge");
