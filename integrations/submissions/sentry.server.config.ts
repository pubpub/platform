// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "~/lib/env.mjs";

if (env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://7c82e3153327133e3fd930edb146bd6e@o31718.ingest.sentry.io/4505959387430913",

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,
	});
}
