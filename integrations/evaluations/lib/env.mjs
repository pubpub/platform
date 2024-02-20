// @ts-check

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	shared: {
		NODE_ENV: z.enum(["development", "production", "test"]),
	},
	server: {
		API_KEY: z.string(),
		PUBPUB_URL: z.string().url(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		API_KEY: process.env.API_KEY,
		PUBPUB_URL: process.env.PUBPUB_URL,
	},
	emptyStringAsUndefined: true,
	client: {},
});
