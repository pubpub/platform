// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
	},
	server: {
		API_KEY: z.string(),
		ASSETS_BUCKET_NAME: z.string(),
		ASSETS_REGION: z.string(),
		ASSETS_UPLOAD_KEY: z.string(),
		ASSETS_UPLOAD_SECRET_KEY: z.string(),
		/**
		 * Whether or not to verbosely log `memoize` cache hits and misses
		 */
		CACHE_LOG: z.string().optional(),
		DATABASE_URL: z.string().url(),
		KYSELY_DEBUG: z.string().optional(),
		KYSELY_ARTIFICIAL_LATENCY: z.coerce.number().optional(),
		LOG_LEVEL: z.string().optional(),
		MAILGUN_SMTP_PASSWORD: z.string(),
		MAILGUN_SMTP_USERNAME: z.string(),
		MAILGUN_SMTP_HOST: z.string(),
		MAILGUN_SMTP_PORT: z.string(),
		OTEL_SERVICE_NAME: z.string().optional(),
		HONEYCOMB_API_KEY: z.string().optional(),
		PUBPUB_URL: z.string().url(),
		INBUCKET_URL: z.string().url().optional(),
		CI: z.string().or(z.boolean()).optional(),
		GCLOUD_KEY_FILE: z.string(),
		DATACITE_API_URL: z.string().optional(),
		DATACITE_REPOSITORY_ID: z.string().optional(),
		DATACITE_PASSWORD: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string().optional(),
	},
	client: {},
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
	},
	skipValidation: Boolean(process.env.SKIP_VALIDATION),
	emptyStringAsUndefined: true,
});
