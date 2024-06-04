// Example filename: tracing.js
"use strict";

import { HoneycombSDK } from "@honeycombio/opentelemetry-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
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
