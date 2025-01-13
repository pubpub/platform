/* eslint-disable no-restricted-properties */
import { logger } from "logger";

export async function register() {
	if (process.env.NEXT_RUNTIME === "edge") {
		if (process.env.NODE_ENV === "development") {
			logger.info(
				"NEXT_RUNTIME is `edge` and NODE_ENV is `development`; skipping OTEL + Sentry registration."
			);
			return;
		}
		await import("./instrumentation.edge.mts");
		return;
	}

	logger.info(`Registering instrumentation hook for ${process.env.NEXT_RUNTIME}`);
	if (process.env.NEXT_RUNTIME === "nodejs") {
		if (process.env.NODE_ENV === "development") {
			// logger.info(
			// 	"NEXT_RUNTIME is `nodejs` and NODE_ENV is `development`; skipping OTEL + Sentry registration."
			// );
			return;
		}
		await import("./instrumentation.node.mts");
	} else {
		logger.info("NEXT_RUNTIME is not `nodejs`; skipping OTEL registration.");
	}
}
