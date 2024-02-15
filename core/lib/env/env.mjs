// @ts-check

/**
 * This is an `.mjs` file as that makes it easier to import it in `next.config.mjs`
 * You cannot import `.ts` files there
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

console.log(process.env);
export const env = createEnv({
	server: {
		API_KEY: z.string(),
		ASSETS_BUCKET_NAME: z.string(),
		ASSETS_REGION: z.string(),
		ASSETS_UPLOAD_KEY: z.string(),
		ASSETS_UPLOAD_SECRET_KEY: z.string(),
		DATABASE_URL: z.string().url(),
		JWT_SECRET: z.string(),
		MAILGUN_SMTP_PASSWORD: z.string(),
		MAILGUN_SMTP_USERNAME: z.string(),
		NODE_ENV: z.enum(["development", "production", "test"]),
		SUPABASE_SERVICE_ROLE_KEY: z.string(),
		SUPABASE_WEBHOOKS_API_KEY: z.string(),
		MAILGUN_SMTP_HOST: z.string(),
		MAILGUN_SMTP_PORT: z.string(),
	},
	client: {
		NEXT_PUBLIC_PUBPUB_URL: z.string().url(),
		NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: z.string(),
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
	},
	runtimeEnv: {
		API_KEY: process.env.API_KEY,
		ASSETS_BUCKET_NAME: process.env.ASSETS_BUCKET_NAME,
		ASSETS_REGION: process.env.ASSETS_REGION,
		ASSETS_UPLOAD_KEY: process.env.ASSETS_UPLOAD_KEY,
		ASSETS_UPLOAD_SECRET_KEY: process.env.ASSETS_UPLOAD_SECRET_KEY,
		DATABASE_URL: process.env.DATABASE_URL,
		JWT_SECRET: process.env.JWT_SECRET,
		MAILGUN_SMTP_PASSWORD: process.env.MAILGUN_SMTP_PASSWORD,
		MAILGUN_SMTP_USERNAME: process.env.MAILGUN_SMTP_USERNAME,
		NODE_ENV: process.env.NODE_ENV,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		SUPABASE_WEBHOOKS_API_KEY: process.env.SUPABASE_WEBHOOKS_API_KEY,
		MAILGUN_SMTP_HOST: process.env.MAILGUN_SMTP_HOST,
		MAILGUN_SMTP_PORT: process.env.MAILGUN_SMTP_PORT,
		NEXT_PUBLIC_PUBPUB_URL: process.env.NEXT_PUBLIC_PUBPUB_URL,
		NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
	},
	emptyStringAsUndefined: true,
});
