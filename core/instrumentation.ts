import { registerAction } from "./actions/init";
import { actions } from "./actions";

import { logger } from "logger";

export async function register() {
	logger.info("Registering actions");
	for (const action of actions) {
		logger.info(`Registering action ${action.name}`);
		await registerAction(action);
	}
	logger.info(`Registering instrumentation hook for ${process.env.NEXT_RUNTIME}`);
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./instrumentation.node");
	} else {
		logger.info("NEXT_RUNTIME is not `nodejs`; skipping OTEL registration.");
	}
}
// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
