import { HoneycombSDK } from "@honeycombio/opentelemetry-node"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"

// function hook() {
console.log("Running instrumentation hook for nodejs...")

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
})

sdk.start()
console.log("instrumentation hooked in for nodejs.")
// }

// hook();
