import { createEnv } from "@t3-oss/env-core";
import { z } from "astro/zod";

console.log(import.meta.env);
export const env = createEnv({
	server: {
		AUTH_TOKEN: z.string(),
		COMMUNITY_SLUG: z.string(),
		PUBPUB_URL: z.string().url(),
		S3_ENDPOINT: z.string().url(),
		S3_REGION: z.string(),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_BUCKET_NAME: z.string(),
		S3_PUBLIC_URL: z.string().url(),
		PORT: z.coerce.number().gte(1024).lte(65535),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
