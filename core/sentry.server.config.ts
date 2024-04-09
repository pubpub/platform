// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import prisma from "~/prisma/db";
import { env } from "./lib/env/env.mjs";

if (env.NODE_ENV === "production") {
	Sentry.init({
		dsn: "https://5012643b47ea6b2c8917f14442066f23@o31718.ingest.sentry.io/4505959187480576",

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 1,

		// Setting this option to true will print useful information to the console while you're setting up Sentry.
		debug: false,
		integrations: [new Sentry.Integrations.Prisma({ client: prisma })],
	});
}
