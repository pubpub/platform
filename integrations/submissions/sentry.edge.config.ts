// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

import { env } from "~/lib/env.mjs"

if (env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://7c82e3153327133e3fd930edb146bd6e@o31718.ingest.sentry.io/4505959387430913",

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,
	})
}
