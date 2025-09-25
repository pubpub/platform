import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const SERVER_ENV = createEnv({
	server: {
		PUBPUB_URL: z.string().url(),
		S3_ENDPOINT: z.string().url().optional(),
		S3_REGION: z.string(),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_BUCKET_NAME: z.string(),
		PORT: z.coerce.number().gte(1024).lte(65535),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
