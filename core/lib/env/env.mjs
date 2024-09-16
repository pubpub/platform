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
		CACHE_LOG: z.boolean().optional(),
		DATABASE_URL: z.string().url(),
		JWT_SECRET: z.string(),
		KYSELY_DEBUG: z.string().optional(),
		LOG_LEVEL: z.string().optional(),
		MAILGUN_SMTP_PASSWORD: z.string(),
		MAILGUN_SMTP_USERNAME: z.string(),
		MAILGUN_SMTP_HOST: z.string(),
		MAILGUN_SMTP_PORT: z.string(),
		OTEL_SERVICE_NAME: z.string().optional(),
		HONEYCOMB_API_KEY: z.string().optional(),
		PUBPUB_URL: z.string().url(),
	},
	client: {},
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
	},
	skipValidation: true, //Boolean(process.env.SKIP_VALIDATION),
	emptyStringAsUndefined: true,
});
