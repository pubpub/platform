import { logger } from "logger";

import { registerCorePubField } from "./actions/_lib/init";
import { corePubFields } from "./actions/corePubFields";

export async function register() {
	logger.info("Registering core fields");
	for (const corePubField of corePubFields) {
		logger.info(`Registering core field ${corePubField.slug}`);
		await registerCorePubField(corePubField);
	}
	logger.info(`Registering instrumentation hook for ${process.env.NEXT_RUNTIME}`);
	if (process.env.NEXT_RUNTIME === "nodejs") {
		if (process.env.NODE_ENV === "development") {
			logger.info(
				"NEXT_RUNTIME is `nodejs` and NODE_ENV is `development`; skipping OTEL registration."
			);
			return;
		}
		await import("./instrumentation.node");
	} else {
		logger.info("NEXT_RUNTIME is not `nodejs`; skipping OTEL registration.");
	}
}
// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
