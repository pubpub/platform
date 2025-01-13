// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

import { env } from "~/lib/env.mjs"

if (env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://ccf8ee31961e83825bd7ab1f02f318a6@o31718.ingest.sentry.io/4505959424327680",

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,
	})
}
