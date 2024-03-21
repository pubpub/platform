// Example filename: tracing.ts

import { logger } from "logger";

export async function register() {
	logger.info(`Registering instrumentation hook for ${process.env.NEXT_RUNTIME}`);
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./instrumentation.node");
	} else {
		logger.info("NEXT_RUNTIME is not `nodejs`; skipping OTEL registration.");
	}
}
// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
