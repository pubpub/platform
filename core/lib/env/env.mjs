/* eslint-disable n/no-process-env */
// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { env as runtimeEnv } from "next-runtime-env";
import { z } from "zod";

export const env = createEnv({
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]).optional(),
		NEXT_PUBLIC_PUBPUB_URL: z.string(),
		NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: z.string(),
		NEXT_PUBLIC_SUPABASE_URL: z.string(),
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
		SUPABASE_SERVICE_ROLE_KEY: z.string(),
		SUPABASE_WEBHOOKS_API_KEY: z.string(),
		MAILGUN_SMTP_HOST: z.string(),
		MAILGUN_SMTP_PORT: z.string(),
		OTEL_SERVICE_NAME: z.string().optional(),
		HONEYCOMB_API_KEY: z.string().optional(),
		PUBPUB_URL: z.string().url(),
		SUPABASE_PUBLIC_KEY: z.string(),
		SUPABASE_URL: z.string().url(),
	},
	client: {},
	experimental__runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_PUBPUB_URL: runtimeEnv("NEXT_PUBLIC_PUBPUB_URL"),
		NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: runtimeEnv("NEXT_PUBLIC_SUPABASE_PUBLIC_KEY"),
		NEXT_PUBLIC_SUPABASE_URL: runtimeEnv("NEXT_PUBLIC_SUPABASE_URL"),
	},
	skipValidation: true, //Boolean(process.env.SKIP_VALIDATION),
	emptyStringAsUndefined: true,
});
