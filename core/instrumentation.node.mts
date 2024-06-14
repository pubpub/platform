import { HoneycombSDK } from "@honeycombio/opentelemetry-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { logger } from "logger";

import { registerCorePubField } from "./actions/_lib/init";
import { corePubFields } from "./actions/corePubFields";

logger.info("Registering core fields");
for (const corePubField of corePubFields) {
	logger.info(`Registering core field ${corePubField.slug}`);
	await registerCorePubField(corePubField);
}

// function hook() {
logger.info("Running instrumentation hook for nodejs...");

const sdk = new HoneycombSDK({
	instrumentations: [
		getNodeAutoInstrumentations({
			// We recommend disabling fs automatic instrumentation because
			// it can be noisy and expensive during startup
			"@opentelemetry/instrumentation-fs": {
				enabled: false,
			},
		}),
	],
});

sdk.start();
logger.info("instrumentation hooked in for nodejs.");
// }

// hook();
