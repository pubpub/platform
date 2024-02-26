// Example filename: tracing.ts

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
// Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
