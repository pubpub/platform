// Example filename: tracing.ts

export async function register() {
	console.log(`Registering instrumentation hook for ${process.env.NEXT_RUNTIME}`)
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./instrumentation.node")
	} else {
		console.log("NEXT_RUNTIME is not `nodejs`; skipping OTEL registration.")
	}
}
// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
